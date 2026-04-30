import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate value',
      details: err.keyValue,
    });
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.error('[error]', err);
  return res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
