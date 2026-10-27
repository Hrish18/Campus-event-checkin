
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import QRCode from 'qrcode';

import { env } from '../config/env.js';
import Event from '../models/Event.js';
import Student, { STATUS } from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Return only public event information
const eventSummary = (event) => ({
  _id: event._id,
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  venue: event.venue
});

// GET PUBLIC EVENT
export const getPublicEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.isValidObjectId(eventId)) {
    throw new ApiError(404, 'Event not found');
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({
    event: eventSummary(event)
  });
});

// STUDENT LOGIN
export const studentLogin = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { studentId, password } = req.body || {};

  if (!mongoose.isValidObjectId(eventId)) {
    throw new ApiError(404, 'Event not found');
  }

  if (
    typeof studentId !== 'string' ||
    typeof password !== 'string' ||
    !studentId.trim() ||
    !password
  ) {
    throw new ApiError(
      400,
      'Student ID and password are required'
    );
  }

  const student = await Student.findOne({
    event: eventId,
    rollNumber: studentId.trim().toUpperCase()
  }).select('+passwordHash');

  if (
    !student ||
    !student.passwordHash ||
    !(await bcrypt.compare(password, student.passwordHash))
  ) {
    throw new ApiError(
      401,
      'Invalid Student ID or password'
    );
  }

  const token = jwt.sign(
    {
      id: student._id.toString(),
      eventId: student.event.toString(),
      role: 'student',
      type: 'student-session'
    },
    env.jwtSecret,
    { expiresIn: '2h' }
  );

  res.json({
    message: 'Login successful',
    token,
    eventId: student.event.toString(),
    student: {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      status: student.status
    }
  });
});

// VERIFY STUDENT SESSION
export const requireStudent = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(
      401,
      'Please log in as a student'
    );
  }

  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(
      401,
      'Student session expired. Please log in again'
    );
  }

  if (
    payload.role !== 'student' ||
    payload.type !== 'student-session'
  ) {
    throw new ApiError(
      403,
      'Access denied. Invalid student session'
    );
  }

  const { eventId } = req.params;

  // The URL must contain the same event ID as the login token.
  if (
    !mongoose.isValidObjectId(eventId) ||
    payload.eventId !== eventId
  ) {
    throw new ApiError(
      403,
      'Event mismatch. Please log in again using the correct event link'
    );
  }

  const student = await Student.findOne({
    _id: payload.id,
    event: payload.eventId
  });

  if (!student) {
    throw new ApiError(
      403,
      'Student is not registered for this event'
    );
  }

  req.student = student;
  next();
});

// GENERATE 60-SECOND QR CODE
export const generateStudentQR = asyncHandler(async (req, res) => {
  const student = req.student;

  if (!student) {
    throw new ApiError(
      401,
      'Please log in before generating a QR code'
    );
  }

  if (student.status === STATUS.CHECKED_IN) {
    throw new ApiError(
      409,
      'You have already checked in for this event'
    );
  }

  // Generate a unique QR token
  const qrToken = jwt.sign(
    {
      id: student._id.toString(),
      eventId: student.event.toString(),
      role: 'student',
      type: 'checkin-qr',
      nonce: crypto.randomBytes(16).toString('hex')
    },
    env.jwtSecret,
    { expiresIn: '60s' }
  );

  // Convert the temporary token into a QR image
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    width: 480,
    margin: 2,
    errorCorrectionLevel: 'M'
  });

  const decoded = jwt.decode(qrToken);

  res.json({
    message: 'QR code generated successfully',
    student: {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      status: student.status
    },
    qrDataUrl,
    expiresAt: decoded.exp * 1000,
    expiresIn: 60
  });
});
