import crypto from "crypto";
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OfferPage, IOfferPage } from '../models/OfferPage';
import { authenticateToken } from '../middleware/auth';

export const offerPagesRouter = Router();

// Helper to get tenantId from request (JWT token OR header for super_admin)
const getTenantId = (req: Request): string | undefined => {
  // First try from JWT token (normal users)
  if ((req as any).user?.tenantId) {
    return (req as any).user.tenantId;
  }
  // Fallback to x-tenant-id header (for super_admin viewing other tenants)
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    return headerTenantId;
  }
  // Fallback to query param
  return req.query.tenantId as string | undefined;
};

// Validation schema for creating/updating offer pages
const offerPageSchema = z.object({
  productId: z.number().optional(),
  productTitle: z.string().min(1, 'Product title is required'),
  searchQuery: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL'),
  offerEndDate: z.string().transform(str => new Date(str)),
  description: z.string().min(1, 'Description is required'),
  productOfferInfo: z.string().optional().default(''),
  paymentSectionTitle: z.string().optional().default(''),
  benefits: z.array(z.object({
    id: z.string().default(() => crypto.randomUUID()),
    text: z.string()
  })).optional().default([]),
  whyBuySection: z.string().optional().default(''),
  urlSlug: z.string().min(1, 'URL slug is required'),
  status: z.enum(['draft', 'published']).optional().default('draft')
});

const updateOfferPageSchema = offerPageSchema.partial();

// Helper to generate unique slug
const generateUniqueSlug = async (baseSlug: string, tenantId: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let counter = 0;
  let uniqueSlug = slug;
  
  while (true) {
    const query: any = { tenantId, urlSlug: uniqueSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await OfferPage.findOne(query);
    if (!existing) break;
    
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }
  
  return uniqueSlug;
};

// GET /api/landing-page - Get all offer pages for tenant
offerPagesRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    
    const query: any = { tenantId };
    if (status && ['draft', 'published'].includes(status as string)) {
      query.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [offerPages, total] = await Promise.all([
      OfferPage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      OfferPage.countDocuments(query)
    ]);
    
    res.json({
      data: offerPages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[OfferPages] GET error:', error);
    res.status(500).json({ error: 'Failed to fetch offer pages' });
  }
});

// GET /api/landing-page/:id - Get single offer page by ID
offerPagesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId, incrementViews } = req.query;
    
    const query: any = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    
    const offerPage = await OfferPage.findOne(query);
    
    if (!offerPage) {
      return res.status(404).json({ error: 'Offer page not found' });
    }
    
    // Increment views if requested (for public page views)
    if (incrementViews === 'true') {
      await OfferPage.updateOne({ _id: id }, { $inc: { views: 1 } });
    }
    
    res.json(offerPage);
  } catch (error) {
    console.error('[OfferPages] GET by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch offer page' });
  }
});

// GET /api/landing-page/slug/:slug - Get offer page by slug (for public route)
offerPagesRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { tenantId, incrementViews } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const offerPage = await OfferPage.findOne({
      tenantId,
      urlSlug: slug,
      status: 'published'
    });
    
    if (!offerPage) {
      return res.status(404).json({ error: 'Offer page not found' });
    }
    
    // Increment views for public page views
    if (incrementViews === 'true') {
      await OfferPage.updateOne(
        { _id: offerPage._id },
        { $inc: { views: 1 } }
      );
    }
    
    res.json(offerPage);
  } catch (error) {
    console.error('[OfferPages] GET by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch offer page' });
  }
});

// POST /api/landing-page - Create new offer page
offerPagesRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const validatedData = offerPageSchema.parse(req.body);
    
    // Generate unique slug
    const uniqueSlug = await generateUniqueSlug(validatedData.urlSlug, tenantId);
    
    const offerPageData: Partial<IOfferPage> = {
      tenantId,
      ...validatedData,
      urlSlug: uniqueSlug,
      publishedAt: validatedData.status === 'published' ? new Date() : undefined
    };
    
    const offerPage = new OfferPage(offerPageData);
    await offerPage.save();
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${tenantId}`).emit('offer-page-created', offerPage);
    }
    
    res.status(201).json(offerPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('[OfferPages] POST error:', error);
    res.status(500).json({ error: 'Failed to create offer page' });
  }
});

// PUT /api/landing-page/:id - Update offer page
offerPagesRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = getTenantId(req);
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const existingPage = await OfferPage.findOne({ _id: id, tenantId });
    if (!existingPage) {
      return res.status(404).json({ error: 'Offer page not found' });
    }
    
    const validatedData = updateOfferPageSchema.parse(req.body);
    
    // If slug is being changed, ensure uniqueness
    if (validatedData.urlSlug && validatedData.urlSlug !== existingPage.urlSlug) {
      validatedData.urlSlug = await generateUniqueSlug(validatedData.urlSlug, tenantId, id);
    }
    
    // Update publishedAt if status changed to published
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'published' && existingPage.status !== 'published') {
      updateData.publishedAt = new Date();
    }
    
    const updatedPage = await OfferPage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${tenantId}`).emit('offer-page-updated', updatedPage);
    }
    
    res.json(updatedPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('[OfferPages] PUT error:', error);
    res.status(500).json({ error: 'Failed to update offer page' });
  }
});

// DELETE /api/landing-page/:id - Delete offer page
offerPagesRouter.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = getTenantId(req);
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const deletedPage = await OfferPage.findOneAndDelete({ _id: id, tenantId });
    
    if (!deletedPage) {
      return res.status(404).json({ error: 'Offer page not found' });
    }
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${tenantId}`).emit('offer-page-deleted', { id });
    }
    
    res.json({ message: 'Offer page deleted successfully', id });
  } catch (error) {
    console.error('[OfferPages] DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete offer page' });
  }
});

// POST /api/landing-page/:id/increment-orders - Increment order count
offerPagesRouter.post('/:id/increment-orders', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await OfferPage.updateOne(
      { _id: id },
      { $inc: { orders: 1 } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Offer page not found' });
    }
    
    res.json({ message: 'Order count incremented' });
  } catch (error) {
    console.error('[OfferPages] Increment orders error:', error);
    res.status(500).json({ error: 'Failed to increment orders' });
  }
});

export default offerPagesRouter;
