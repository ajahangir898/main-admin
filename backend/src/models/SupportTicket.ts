import mongoose, { Document, Schema } from 'mongoose';

export type TicketType = 'issue' | 'feedback' | 'feature';
export type TicketStatus = 'pending' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  type: TicketType;
  title: string;
  description: string;
  images: string[];
  status: TicketStatus;
  priority: TicketPriority;
  submittedBy: {
    userId: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    userId: string;
    name: string;
    email: string;
  };
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    tenantId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: ['issue', 'feedback', 'feature'], 
      required: true,
      index: true 
    },
    title: { type: String, required: false, default: '' },
    description: { type: String, required: true },
    images: [{ type: String }],
    status: { 
      type: String, 
      enum: ['pending', 'in-progress', 'resolved', 'closed'], 
      default: 'pending',
      index: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    submittedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true }
    },
    assignedTo: {
      userId: { type: String },
      name: { type: String },
      email: { type: String }
    },
    comments: [{
      id: { type: String, required: true },
      userId: { type: String, required: true },
      userName: { type: String, required: true },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    resolvedAt: { type: Date }
  },
  { 
    timestamps: true,
    collection: 'support_tickets'
  }
);

// Compound indexes for common queries
supportTicketSchema.index({ tenantId: 1, status: 1 });
supportTicketSchema.index({ tenantId: 1, type: 1 });
supportTicketSchema.index({ tenantId: 1, createdAt: -1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
