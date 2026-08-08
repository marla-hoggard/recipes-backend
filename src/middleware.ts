import { NextFunction, Request, Response } from 'express';
import User from './models/user';
import { ApiError } from './errors/ApiError';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.body.token;
  if (!token) {
    throw new ApiError({ status: 401, message: 'Access denied. No token provided.' });
  }

  const user = await User.findOne({ token }).lean();
  if (!user) {
    throw new ApiError({ status: 401, message: 'Access denied. Invalid token.' });
  }
  (req as any).user = user;
  return next();
};
