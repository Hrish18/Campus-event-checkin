import mongoose from 'mongoose';

export const STATUS = { REGISTERED: 'registered', CHECKED_IN: 'checked-in' };

const studentSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    rollNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 50 },
    email: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    passwordHash: { type: String, required: true, select: false },
    // Internal legacy identifier, never accepted as a check-in token.
    code: { type: String, required: true, unique: true, uppercase: true },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.REGISTERED, index: true },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', default: null },
  },
  { timestamps: true }
);

// A student (by roll number) can be registered only once per event.
studentSchema.index({ event: 1, rollNumber: 1 }, { unique: true });

export default mongoose.model('Student', studentSchema);
