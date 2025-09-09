import { NextFunction, Request, Response } from 'express';
import User from './models/user';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  const user = await User.findOne({ token }).lean();
  if (!user) {
    return res.status(401).send('Access denied. Invalid token.');
  } else {
    (req as any).user = user;
  }
  return next();
};
