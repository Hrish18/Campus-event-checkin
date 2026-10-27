import mongoose from 'mongoose';

const organizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Only organizers can create events and check students in.
    role: { type: String, enum: ['organizer'], default: 'organizer' },
  },
  { timestamps: true }
);

export default mongoose.model('Organizer', organizerSchema);
