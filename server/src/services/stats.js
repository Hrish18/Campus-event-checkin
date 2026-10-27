import Student, { STATUS } from '../models/Student.js';

export async function getStats(eventId) {
  const [total, checkedIn] = await Promise.all([
    Student.countDocuments({ event: eventId }),
    Student.countDocuments({ event: eventId, status: STATUS.CHECKED_IN }),
  ]);
  return { total, checkedIn, remaining: total - checkedIn };
}

export function toStudentDTO(s) {
  return {
    _id: s._id,
    name: s.name,
    rollNumber: s.rollNumber,
    email: s.email,
    code: s.code,
    status: s.status,
    checkedInAt: s.checkedInAt,
  };
}
