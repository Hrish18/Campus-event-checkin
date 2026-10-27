import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Student, { STATUS } from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getStats, toStudentDTO } from '../services/stats.js';
import { emitAttendance } from '../socket.js';

export const checkIn = asyncHandler(async (req, res) => {
  const token = req.body?.code;
  if (typeof token !== 'string' || !token.trim()) throw new ApiError(400, 'Please scan a valid QR code');
  let payload;
  try { payload = jwt.verify(token.trim(), env.jwtSecret); }
  catch (err) { throw new ApiError(err.name === 'TokenExpiredError' ? 401 : 400, err.name === 'TokenExpiredError' ? 'QR code has expired' : 'Invalid QR code'); }
  if (payload.type !== 'checkin-qr' || payload.role !== 'student' || !payload.nonce) throw new ApiError(400, 'Invalid QR code');
  if (payload.eventId !== req.event._id.toString()) throw new ApiError(403, 'This QR code belongs to a different event');
  const student = await Student.findOneAndUpdate(
    { _id: payload.id, event: req.event._id, status: STATUS.REGISTERED },
    { $set: { status: STATUS.CHECKED_IN, checkedInAt: new Date(), checkedInBy: req.user.id } },
    { new: true }
  );
  if (!student) {
    const existing = await Student.findOne({ _id: payload.id, event: req.event._id });
    if (!existing) throw new ApiError(404, 'Student not registered for this event');
    throw new ApiError(409, `${existing.name} is already checked in`, { student: toStudentDTO(existing) });
  }
  const dto = toStudentDTO(student);
  const stats = await getStats(req.event._id);
  emitAttendance(req.event._id, { student: dto, stats });
  res.json({ message: `${student.name} checked in successfully`, student: dto, stats });
});
