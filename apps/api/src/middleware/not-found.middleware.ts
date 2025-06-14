import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next();
  }

  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
  });
};
