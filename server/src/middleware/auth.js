import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Organizer from '../models/Organizer.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token. Please log in again.');
  }

  const user = await Organizer.findById(payload.id).select('name email role');
  if (!user) throw new ApiError(401, 'Account no longer exists');

  req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
  next();
});

export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(new ApiError(403, 'You do not have permission to perform this action'));
