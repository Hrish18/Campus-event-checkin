import crypto from 'crypto';
import mongoose from 'mongoose';

const CODE_RE = /^[A-Z0-9]{6,20}$/;
const PREFIX = 'CEC';

/** 10-char uppercase hex code, e.g. "9F3A1C07BE". Easy to type by hand if a scan fails. */
export function generateCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

/** Contents of the QR code: event ID + the student's unique code. */
export function buildQrPayload(eventId, code) {
  return `${PREFIX}|${eventId}|${code}`;
}

/**
 * Accepts either a scanned QR payload ("CEC|<eventId>|<code>") or a manually
 * typed code. Returns { eventId|null, code } or null if it is malformed.
 */
export function parseScan(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  if (value.includes('|')) {
    const parts = value.split('|');
    if (parts.length !== 3 || parts[0] !== PREFIX) return null;
    const [, eventId, rawCode] = parts;
    const code = rawCode.toUpperCase();
    if (!mongoose.isValidObjectId(eventId) || !CODE_RE.test(code)) return null;
    return { eventId, code };
  }

  const code = value.toUpperCase();
  return CODE_RE.test(code) ? { eventId: null, code } : null;
}
