import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    date: { type: Date, required: true },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "HH:mm"
    venue: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
