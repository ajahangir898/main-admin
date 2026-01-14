import mongoose, { Schema, Document } from 'mongoose';

export interface IOfferPageBenefit {
  id: string;
  text: string;
}

export interface IOfferPage extends Document {
  tenantId: string;
  productId?: number;
  productTitle: string;
  searchQuery?: string;
  imageUrl: string;
  offerEndDate: Date;
  description: string;
  productOfferInfo: string; // HTML content
  paymentSectionTitle: string; // HTML content
  benefits: IOfferPageBenefit[];
  whyBuySection: string; // HTML content
  urlSlug: string;
  status: 'draft' | 'published';
  views: number;
  orders: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const OfferPageBenefitSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const OfferPageSchema = new Schema<IOfferPage>({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: Number,
    index: true
  },
  productTitle: {
    type: String,
    required: true,
    trim: true
  },
  searchQuery: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  offerEndDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  productOfferInfo: {
    type: String,
    default: ''
  },
  paymentSectionTitle: {
    type: String,
    default: ''
  },
  benefits: {
    type: [OfferPageBenefitSchema],
    default: []
  },
  whyBuySection: {
    type: String,
    default: ''
  },
  urlSlug: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  orders: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for tenant + slug uniqueness
OfferPageSchema.index({ tenantId: 1, urlSlug: 1 }, { unique: true });
OfferPageSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const OfferPage = mongoose.model<IOfferPage>('OfferPage', OfferPageSchema);
