import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[backend] Unhandled error', err);
  return res.status(500).json({ error: 'Internal server error' });
};
