import mongoose from 'mongoose';
import Event from '../models/Event.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/** Loads :eventId into req.event and makes sure it belongs to the logged-in organizer. */
export default asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  if (!mongoose.isValidObjectId(eventId)) throw new ApiError(404, 'Event not found');

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.organizer.toString() !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this event');
  }

  req.event = event;
  next();
});
