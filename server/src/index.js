import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './socket.js';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.clientOrigins, credentials: true } });
initSocket(io);

await connectDB();
server.listen(env.port, () => console.log(`API listening on port ${env.port}`));
