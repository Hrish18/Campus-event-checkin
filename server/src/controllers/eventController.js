import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Student, { STATUS } from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getStats } from '../services/stats.js';

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, time, venue } = req.body || {};
  if (!title?.trim()) throw new ApiError(400, 'Title is required');
  if (!venue?.trim()) throw new ApiError(400, 'Venue is required');
  if (!date || Number.isNaN(new Date(date).getTime())) throw new ApiError(400, 'A valid date is required');
  if (!/^\d{2}:\d{2}$/.test(time || '')) throw new ApiError(400, 'A valid time (HH:mm) is required');

  const event = await Event.create({ organizer: req.user.id, title, description, date, time, venue });
  res.status(201).json({ event });
});

export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).sort({ date: -1, time: -1 }).lean();

  const counts = await Student.aggregate([
    { $match: { event: { $in: events.map((e) => e._id) } } },
    { $group: { _id: { event: '$event', status: '$status' }, n: { $sum: 1 } } },
  ]);

  const byEvent = new Map();
  for (const { _id, n } of counts) {
    const key = _id.event.toString();
    const entry = byEvent.get(key) || { total: 0, checkedIn: 0 };
    entry.total += n;
    if (_id.status === STATUS.CHECKED_IN) entry.checkedIn += n;
    byEvent.set(key, entry);
  }

  res.json({
    events: events.map((e) => ({ ...e, stats: byEvent.get(e._id.toString()) || { total: 0, checkedIn: 0 } })),
  });
});

export const getEvent = asyncHandler(async (req, res) => {
  res.json({ event: req.event, stats: await getStats(req.event._id) });
});

export const getEventStats = asyncHandler(async (req, res) => {
  res.json(await getStats(req.event._id));
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await Student.deleteMany({ event: req.event._id });
  await req.event.deleteOne();
  res.json({ message: 'Event deleted' });
});

export const _isValidId = mongoose.isValidObjectId;
