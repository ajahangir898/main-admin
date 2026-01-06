import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/mongo';

const router = Router();

interface VisitorDoc {
  tenantId: string;
  visitorId: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  country?: string;
  city?: string;
  firstVisit: Date;
  lastVisit: Date;
  pageViews: number;
  pages: string[];
}

interface PageViewDoc {
  tenantId: string;
  visitorId: string;
  page: string;
  referrer?: string;
  timestamp: Date;
}

// Track a page view
router.post('/:tenantId/track', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { visitorId, page, referrer, userAgent, device, browser } = req.body;
    
    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    const db = await getDatabase();
    const visitorsCollection = db.collection<VisitorDoc>('visitors');
    const pageViewsCollection = db.collection<PageViewDoc>('page_views');
    
    const now = new Date();
    
    // Upsert visitor
    await visitorsCollection.updateOne(
      { tenantId, visitorId },
      {
        $set: {
          lastVisit: now,
          userAgent,
          device,
          browser,
        },
        $setOnInsert: {
          tenantId,
          visitorId,
          firstVisit: now,
        },
        $inc: { pageViews: 1 },
        $addToSet: { pages: page }
      },
      { upsert: true }
    );
    
    // Record page view
    await pageViewsCollection.insertOne({
      tenantId,
      visitorId,
      page: page || '/',
      referrer,
      timestamp: now
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

// Get visitor stats
router.get('/:tenantId/stats', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { period = '7d' } = req.query;
    
    const db = await getDatabase();
    const visitorsCollection = db.collection<VisitorDoc>('visitors');
    const pageViewsCollection = db.collection<PageViewDoc>('page_views');
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Total unique visitors
    const totalVisitors = await visitorsCollection.countDocuments({ tenantId });
    
    // Visitors in period
    const periodVisitors = await visitorsCollection.countDocuments({
      tenantId,
      lastVisit: { $gte: startDate }
    });
    
    // Today's visitors
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVisitors = await visitorsCollection.countDocuments({
      tenantId,
      lastVisit: { $gte: todayStart }
    });
    
    // Total page views in period
    const totalPageViews = await pageViewsCollection.countDocuments({
      tenantId,
      timestamp: { $gte: startDate }
    });
    
    // Page views by day (last 7 days)
    const dailyStats = await pageViewsCollection.aggregate([
      {
        $match: {
          tenantId,
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          date: '$_id',
          views: 1,
          visitors: { $size: '$uniqueVisitors' }
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
    
    // Top pages
    const topPages = await pageViewsCollection.aggregate([
      {
        $match: {
          tenantId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          page: '$_id',
          views: 1,
          _id: 0
        }
      }
    ]).toArray();
    
    // Device breakdown
    const devices = await visitorsCollection.aggregate([
      {
        $match: {
          tenantId,
          lastVisit: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      }
    ]).toArray() as { _id: string | null; count: number }[];
    
    res.json({
      totalVisitors,
      periodVisitors,
      todayVisitors,
      totalPageViews,
      dailyStats,
      topPages,
      devices: devices.map(d => ({ device: d._id || 'Unknown', count: d.count }))
    });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    res.status(500).json({ error: 'Failed to get visitor stats' });
  }
});

// Get online visitors count (visitors active in last 5 minutes)
router.get('/:tenantId/online', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    const db = await getDatabase();
    const visitorsCollection = db.collection<VisitorDoc>('visitors');
    
    // Consider visitors "online" if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineCount = await visitorsCollection.countDocuments({
      tenantId,
      lastVisit: { $gte: fiveMinutesAgo }
    });
    
    res.json({ online: onlineCount });
  } catch (error) {
    console.error('Error getting online visitors:', error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

export const visitorsRouter = router;
