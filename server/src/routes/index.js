import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import ownEvent from '../middleware/ownEvent.js';
import * as auth from '../controllers/authController.js';
import * as events from '../controllers/eventController.js';
import * as students from '../controllers/studentController.js';
import { checkIn } from '../controllers/checkinController.js';
import * as pub from '../controllers/publicController.js';

const router = Router();

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
  });

// ---- Auth ----
router.post('/auth/register', limiter(30), auth.register);
router.post('/auth/login', limiter(30), auth.login);
router.get('/auth/me', requireAuth, auth.me);

// ---- Public (students) ----
router.get('/public/events/:eventId', limiter(300), pub.getPublicEvent);
router.post('/public/events/:eventId/student-login', limiter(30), pub.studentLogin);
router.post('/public/events/:eventId/generate-qr', limiter(60), pub.requireStudent, pub.generateStudentQR);

// ---- Organizer-only ----
const organizer = [requireAuth, requireRole('organizer')];

router.get('/events', organizer, events.listEvents);
router.post('/events', organizer, events.createEvent);

router.get('/events/:eventId', organizer, ownEvent, events.getEvent);
router.delete('/events/:eventId', organizer, ownEvent, events.deleteEvent);
router.get('/events/:eventId/stats', organizer, ownEvent, events.getEventStats);

router.get('/events/:eventId/students', organizer, ownEvent, students.listStudents);
router.post('/events/:eventId/students', organizer, ownEvent, students.addStudent);
router.post('/events/:eventId/students/bulk', organizer, ownEvent, students.bulkAddStudents);
router.delete('/events/:eventId/students/:studentId', organizer, ownEvent, students.removeStudent);

router.post('/events/:eventId/checkin', organizer, ownEvent, checkIn);

export default router;
