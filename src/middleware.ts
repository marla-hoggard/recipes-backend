import { Request, RequestHandler, Response } from 'express';
import User from './models/user';
import Recipe from './models/recipe';
import { ApiError } from './errors/ApiError';
import { AuthedRequest } from './types';

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

type AuthedHandler = (req: AuthedRequest, res: Response) => unknown;

/**
 * Wraps a controller that requires the user to be signed in.
 * Looks up the user by their bearer token and attaches it to the request object.
 * Throws a 401 error if the user is not signed in or the token is invalid.
 *
 * Wrap controllers with this middleware to enforce authentication on that route.
 * Using a wrapper pattern properly narrows the request type to AuthedRequest so the controller
 * has access to the user object without needing to cast the request type.
 */
export const requireAuth = (handler: AuthedHandler): RequestHandler => {
  return async (req, res) => {
    const token = getBearerToken(req);
    if (!token) {
      throw new ApiError({ status: 401, message: 'Access denied. No token provided.' });
    }

    const user = await User.findOne({ token }).lean();
    if (!user) {
      throw new ApiError({ status: 401, message: 'Access denied. Invalid token.' });
    }

    const authedReq: AuthedRequest = Object.assign(req, { user });

    return handler(authedReq, res);
  };
};

/**
 * Wraps a handler that additionally requires the signed-in user to be an
 * admin, or to match the recipe's `submitted_by` name.
 *
 * TODO: Migrate to submitted_by userIds for better ownership tracking.
 */
export const requireAuthorOrAdmin = (handler: AuthedHandler): RequestHandler =>
  requireAuth(async (req, res) => {
    if (!req.user.is_admin) {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new ApiError({ message: 'Invalid recipe ID' });
      }

      const recipe = await Recipe.findOne({ id }).lean();
      if (!recipe) {
        throw new ApiError({ status: 404, message: 'Recipe not found' });
      }

      const fullName = `${req.user.first_name} ${req.user.last_name}`.trim().toLowerCase();
      if (recipe.submitted_by.trim().toLowerCase() !== fullName) {
        throw new ApiError({
          status: 403,
          message: 'You do not have permission to modify this recipe.',
        });
      }
    }

    return handler(req, res);
  });
