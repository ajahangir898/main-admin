import mongoose, { Schema, Document } from 'mongoose';

export interface IEntity extends Document {
  name: string;
  phone: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema = new Schema<IEntity>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Customer', 'Supplier', 'Employee'],
      required: [true, 'Please specify entity type'],
    },
    totalOwedToMe: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIOweThemNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance

EntitySchema.index({ type: 1, name: 1 });
EntitySchema.index({ createdAt: -1 });

export const Entity = mongoose.model<IEntity>('Entity', EntitySchema);
