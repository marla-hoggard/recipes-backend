import { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";

/**
 * Catches any request that didn't match a route and responds with a consistently
 * shaped 404, instead of falling through to Express's default HTML 404 page.
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res
    .status(404)
    .json({
      error: { message: `No route found for ${req.method} ${req.path}` },
    });
};

/**
 * Central error handler. Must be registered after all routes/middleware.
 * Any thrown ApiError (including rejected promises from async handlers, which
 * Express 5 forwards here automatically) is turned into its intended response.
 * Anything else is an unexpected/programming error: log it and return a generic
 * 500 rather than leaking internals to the client.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        ...(err.details && { details: err.details }),
        ...(err.hint && { hint: err.hint }),
      },
    });
  }

  console.error("Unexpected error:", err);
  return res
    .status(500)
    .json({
      error: { message: "Something went wrong. Please try again later." },
    });
};
