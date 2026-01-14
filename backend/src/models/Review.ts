import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  productId: number;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  headline?: string;
  comment: string;
  verified: boolean;
  helpful: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: {
    type: Number,
    required: true,
    index: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  headline: {
    type: String,
    trim: true,
    maxlength: 200
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ReviewSchema.index({ productId: 1, tenantId: 1, status: 1 });
ReviewSchema.index({ userId: 1, tenantId: 1 });
ReviewSchema.index({ tenantId: 1, createdAt: -1 });

// Prevent duplicate reviews from same user for same product
ReviewSchema.index({ productId: 1, userId: 1, tenantId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
