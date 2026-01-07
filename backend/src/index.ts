import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './db/mongo';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { tenantsRouter } from './routes/tenants';
import { tenantDataRouter } from './routes/tenantData';
import { ordersRouter } from './routes/orders';
import { ensureTenantIndexes } from './services/tenantsService';
import { expensesRouter } from './routes/expenses';
import { profitLossRouter } from './routes/profitLoss';
import { incomesRouter } from './routes/incomes';
import dueListRoutes from './routes/dueListRoutes';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';
import { notificationsRouter } from './routes/notifications';
import { courierRouter } from './routes/courier';
import supportRouter from './routes/support';
import { User } from './models/User';
import imageOptimizeRouter from './routes/imageOptimize';
import { subscriptionsRouter } from './routes/subscriptions';
import auditLogsRouter from './routes/auditLogs';


const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin: string | string[] | undefined, callback: (arg0: Error | null, arg1: boolean | undefined) => void) => {
      // Allow requests with no origin (same-origin requests)
      if (!origin) return callback(null, true);
      
      // Get allowed origins from environment
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
      const systemnextPattern = /^https?:\/\/([a-z0-9-]+\.)?systemnextit\.com$/i;
      const cartngetPattern = /^https?:\/\/([a-z0-9-]+\.)?cartnget\.shop$/i;
      const localhostPattern = /^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/i;
      const origins = Array.isArray(origin) ? origin : [origin];
      const isAllowed = origins.some(o => 
        systemnextPattern.test(o) || 
        cartngetPattern.test(o) ||
        localhostPattern.test(o) ||
        allowedOrigins.includes(o) ||
        allowedOrigins.some(allowed => allowed.includes('*') && new RegExp(allowed.replace(/\*/g, '.*')).test(o))
      );
      if (isAllowed) {
        return callback(null, true);
      }
      console.warn('[Socket.IO CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);
  
  // Join tenant-specific room
  socket.on('join-tenant', (tenantId: string) => {
    socket.join(`tenant:${tenantId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined tenant:${tenantId}`);
  });
  
  // Leave tenant room
  socket.on('leave-tenant', (tenantId: string) => {
    socket.leave(`tenant:${tenantId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

// CORS - Allow all origins for now (wildcard) to support all subdomains
const corsOptions: cors.CorsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-subdomain', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours - cache preflight
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly for all routes
app.options('*', cors(corsOptions));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Serve static files for uploaded images
// Use image optimization route first (handles ?w=&q= params)
app.use('/uploads', imageOptimizeRouter);
// Fallback to static files for non-optimized requests
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y', // 1 year cache for immutable assets
  immutable: true,
}));

app.get('/', (_req, res) => {
  res.json({ name: 'seven-days-backend', version: '0.1.0' });
});

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenant-data', tenantDataRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/profit-loss', profitLossRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/courier', courierRouter);
app.use('/api/support', supportRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api', dueListRoutes);

// Visitors tracking (import at top of file)
import { visitorsRouter } from './routes/visitors';
app.use('/api/visitors', visitorsRouter);

app.use('/', uploadRouter);

app.use(errorHandler);

// Seed default super admin user
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@admin.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const superAdmin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      });
      
      await superAdmin.save();
      console.log('[backend] Default super admin created: admin@admin.com / admin123');
    } else {
      console.log('[backend] Super admin already exists');
    }
  } catch (error) {
    console.error('[backend] Error seeding admin:', error);
  }
};

const bootstrap = async () => {
  // Connect native MongoDB client eagerly for fast initial API calls
  try {
    await connectMongo();
  } catch (err) {
    console.error('[backend] Native MongoDB connection error:', err);
    process.exit(1);
  }

  // Connect Mongoose for Entity/Transaction models
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
    });
    console.log('[backend] Mongoose connected to MongoDB');
    
    // Seed default super admin user
    await seedDefaultAdmin();
  } catch (err) {
    console.error('[backend] Mongoose connection error:', err);
    process.exit(1);
  }

  await ensureTenantIndexes();
  
  // Changed from app.listen to httpServer.listen for Socket.IO
  httpServer.listen(env.port, () => {
    console.log(`[backend] API listening on port ${env.port}`);
  });
};

bootstrap();

// ...existing graceful shutdown code...