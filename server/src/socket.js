import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import Event from './models/Event.js';

let io = null;
const room = (eventId) => `event:${eventId}`;

export function initSocket(server) {
  io = server;

  // Only authenticated organizers may connect.
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, env.jwtSecret);
      if (payload.role !== 'organizer') throw new Error('forbidden');
      socket.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // An organizer can only listen to events they own.
    socket.on('event:join', async (eventId, ack) => {
      try {
        if (!mongoose.isValidObjectId(eventId)) return ack?.({ ok: false });
        const owns = await Event.exists({ _id: eventId, organizer: socket.user.id });
        if (!owns) return ack?.({ ok: false });
        socket.join(room(eventId));
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on('event:leave', (eventId) => socket.leave(room(eventId)));
  });
}

export function emitAttendance(eventId, payload) {
  io?.to(room(eventId.toString())).emit('attendance:update', payload);
}
