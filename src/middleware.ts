import { NextFunction, Request, Response } from 'express';
import User from './models/user';
import Recipe from './models/recipe';
import { ApiError } from './errors/ApiError';

/**
 * Extracts the bearer token from the `Authorization: Bearer <token>` header.
 */
export const getBearerToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.slice('Bearer '.length).trim() || undefined;
};

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
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

/**
 * Allows the request through if the signed-in user is an admin, or if they
 * match the recipe's `submitted_by` name.
 *
 * TODO: Migrate to submitted_by userIds for better ownership tracking.
 */
const checkAuthorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user.is_admin) {
    return next();
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new ApiError({ message: 'Invalid recipe ID' });
  }

  const recipe = await Recipe.findOne({ id }).lean();
  if (!recipe) {
    throw new ApiError({ status: 404, message: 'Recipe not found' });
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim().toLowerCase();
  if (recipe.submitted_by.trim().toLowerCase() !== fullName) {
    throw new ApiError({
      status: 403,
      message: 'You do not have permission to modify this recipe.',
    });
  }

  return next();
};

export const isAuthorOrAdmin = [isAuthenticated, checkAuthorOrAdmin];
