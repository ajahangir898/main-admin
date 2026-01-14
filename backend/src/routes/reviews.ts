import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review, IReview } from '../models/Review';
import { authenticateToken } from '../middleware/auth';

export const reviewsRouter = Router();

// Add CORS middleware for reviews
reviewsRouter.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-id');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Validation schemas
const submitReviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  headline: z.string().max(200).optional(),
  comment: z.string().min(10).max(2000),
  tenantId: z.string()
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  headline: z.string().max(200).optional(),
  comment: z.string().min(10).max(2000).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional()
});

/**
 * GET /api/reviews/product/:productId
 * Get all approved reviews for a product
 */
reviewsRouter.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const reviews = await Review.find({
      productId: parseInt(productId),
      tenantId,
      status: 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews
 * Submit a new review (requires authentication)
 */
reviewsRouter.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = submitReviewSchema.parse(req.body);
    const user = req.user!;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: data.productId,
      userId: user._id.toString(),
      tenantId: data.tenantId
    });

    if (existingReview) {
      return res.status(409).json({
        error: 'You have already submitted a review for this product',
        code: 'REVIEW_EXISTS'
      });
    }

    // Create review - set to pending by default for admin approval
    const review = new Review({
      productId: data.productId,
      tenantId: data.tenantId,
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      rating: data.rating,
      headline: data.headline,
      comment: data.comment,
      verified: false, // Can be set based on purchase history
      status: 'pending' // Pending approval by default
    });

    await review.save();

    res.status(201).json({
      message: 'Review submitted successfully and is pending approval',
      review: review.toObject()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review (user can only update their own)
 */
reviewsRouter.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateReviewSchema.parse(req.body);
    const user = req.user!;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership (users can only edit their own reviews, admins can moderate)
    const isOwner = review.userId === user._id.toString();
    const isAdmin = ['admin', 'super_admin', 'tenant_admin'].includes(user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Users can only update their own review content, not status
    if (isOwner && !isAdmin) {
      delete (data as any).status;
    }

    // Update review
    Object.assign(review, data);
    await review.save();

    res.json({
      message: 'Review updated successfully',
      review: review.toObject()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (user can only delete their own)
 */
reviewsRouter.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    const isOwner = review.userId === user._id.toString();
    const isAdmin = ['admin', 'super_admin', 'tenant_admin'].includes(user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/user/my-reviews
 * Get current user's reviews
 */
reviewsRouter.get('/user/my-reviews', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const tenantId = req.query.tenantId as string;

    const filter: any = { userId: user._id.toString() };
    if (tenantId) {
      filter.tenantId = tenantId;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/admin/all
 * Get all reviews for moderation (admin only)
 */
reviewsRouter.get('/admin/all', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'super_admin', 'tenant_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const tenantId = req.query.tenantId as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filter: any = {};
    
    // Tenant admins can only see their tenant's reviews
    if (user.role === 'tenant_admin') {
      filter.tenantId = user.tenantId;
    } else if (tenantId) {
      filter.tenantId = tenantId;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/reviews/:id/helpful
 * Mark review as helpful
 */
reviewsRouter.patch('/:id/helpful', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    next(error);
  }
});

export default reviewsRouter;
