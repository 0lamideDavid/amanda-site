import type { Request, Response, NextFunction, RequestHandler } from "express";

// Express 4 does not forward a rejected promise from an async route handler
// to next() automatically — an uncaught rejection there can hang the
// request and, left unhandled at the process level, crash the whole server
// (Node terminates on unhandled rejections by default). Every route handler
// in this app is async, so every one needs to go through this.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown,
): RequestHandler {
  return (req, res, next) => {
    // Promise.resolve wraps a sync handler's return value too, so this is
    // safe to use on both sync and async handlers.
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
