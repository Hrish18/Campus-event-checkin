import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { parse } from 'csv-parse/sync';
import Student, { STATUS } from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateCode } from '../utils/codes.js';
import { getStats, toStudentDTO } from '../services/stats.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listStudents = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const filter = { event: req.event._id };
  if (Object.values(STATUS).includes(status)) filter.status = status;
  if (typeof q === 'string' && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: rx }, { rollNumber: rx }, { email: rx }];
  }

  const sort = filter.status === STATUS.CHECKED_IN ? { checkedInAt: -1 } : { name: 1 };
  const students = await Student.find(filter).sort(sort).limit(2000);
  res.json({ students: students.map(toStudentDTO) });
});

export const addStudent = asyncHandler(async (req, res) => {
  const { name, rollNumber, email, password } = req.body || {};
  if (!name?.trim()) throw new ApiError(400, 'Student name is required');
  if (!rollNumber?.trim()) throw new ApiError(400, 'Roll number is required');
  if (email && !EMAIL_RE.test(email)) throw new ApiError(400, 'Email is not valid');
  if (typeof password !== 'string' || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  const passwordHash = await bcrypt.hash(password, 12);

  // Retry in the (very unlikely) event of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const student = await Student.create({
        event: req.event._id,
        name,
        rollNumber,
        email: email || '',
        code: generateCode(),
        passwordHash,
      });
      return res.status(201).json({ student: toStudentDTO(student), stats: await getStats(req.event._id) });
    } catch (err) {
      if (err.code !== 11000) throw err;
      if (err.keyPattern?.rollNumber) {
        throw new ApiError(409, 'A student with this roll number is already registered for this event');
      }
    }
  }
  throw new ApiError(500, 'Could not generate a unique code, please try again');
});

const HEADER_MAP = {
  name: 'name',
  studentname: 'name',
  roll: 'rollNumber',
  rollno: 'rollNumber',
  rollnumber: 'rollNumber',
  email: 'email',
  emailid: 'email',
  password: 'password',
};

export const bulkAddStudents = asyncHandler(async (req, res) => {
  const { csv } = req.body || {};
  if (typeof csv !== 'string' || !csv.trim()) throw new ApiError(400, 'CSV content is required');

  let records;
  try {
    records = parse(csv, {
      columns: (header) =>
        header.map((h) => HEADER_MAP[String(h).trim().toLowerCase().replace(/[\s_-]/g, '')] || null),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch {
    throw new ApiError(400, 'Could not read the CSV file. Check the format.');
  }
  if (records.length === 0) throw new ApiError(400, 'The CSV has no rows');
  if (records.length > 5000) throw new ApiError(400, 'Too many rows (max 5000 per upload)');
  if (!('name' in records[0]) || !('rollNumber' in records[0]) || !('password' in records[0])) {
    throw new ApiError(400, 'CSV must have name, rollNumber and password columns (email is optional)');
  }

  const existing = new Set(
    (await Student.find({ event: req.event._id }).select('rollNumber').lean()).map((s) => s.rollNumber)
  );
  const seenCodes = new Set();
  const toInsert = [];
  const skipped = [];

  for (const [i, row] of records.entries()) {
    const line = i + 2; // +1 for header, +1 for 1-based
    const name = (row.name || '').trim();
    const rollNumber = (row.rollNumber || '').trim().toUpperCase();
    const email = (row.email || '').trim().toLowerCase();
    const password = row.password || '';
    if (password.length < 8) { skipped.push({ line, reason: 'Password must be at least 8 characters' }); continue; }

    if (!name || !rollNumber) { skipped.push({ line, reason: 'Missing name or roll number' }); continue; }
    if (email && !EMAIL_RE.test(email)) { skipped.push({ line, reason: `Invalid email (${email})` }); continue; }
    if (existing.has(rollNumber)) { skipped.push({ line, reason: `Duplicate roll number (${rollNumber})` }); continue; }

    existing.add(rollNumber);
    let code = generateCode();
    while (seenCodes.has(code)) code = generateCode();
    seenCodes.add(code);
    const passwordHash = await bcrypt.hash(password, 12);
    toInsert.push({ event: req.event._id, name, rollNumber, email, code, passwordHash });
  }

  if (toInsert.length) await Student.insertMany(toInsert, { ordered: false });
  res.status(201).json({ added: toInsert.length, skipped, stats: await getStats(req.event._id) });
});

export const removeStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) throw new ApiError(404, 'Student not found');

  const student = await Student.findOne({ _id: studentId, event: req.event._id });
  if (!student) throw new ApiError(404, 'Student not found');
  if (student.status === STATUS.CHECKED_IN) {
    throw new ApiError(409, 'Cannot remove a student who has already checked in');
  }
  await student.deleteOne();
  res.json({ message: 'Student removed', stats: await getStats(req.event._id) });
});
