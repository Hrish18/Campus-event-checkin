import { io } from 'socket.io-client';
import { API_URL, tokenStore } from './api.js';

export function createSocket() {
  return io(API_URL, { auth: { token: tokenStore.get() }, transports: ['websocket', 'polling'] });
}
