# CampusEvent Check-in

A web app for college events with a fixed guest list. Organizers create an event, register students (manually or via CSV), and every student gets a unique QR code. At the door, the organizer scans the QR (or types the backup code) to mark the student present, and a live dashboard shows who has arrived.

**Stack:** React (Vite) + Tailwind CSS · Node.js + Express · MongoDB (Mongoose) · JWT + bcrypt · `qrcode` · Socket.IO

---

## Features

| Area | What it does |
|---|---|
| Auth | Organizer register / login (JWT, bcrypt-hashed passwords) |
| Events | Create events (title, description, date, time, venue), list and delete them |
| Students | Add manually (name + roll number + optional email) or bulk-upload a CSV |
| QR codes | One unique code per student per event; QR contains `CEC\|<eventId>\|<code>` |
| Check-in | Scan with the camera or type the code; status flips `registered → checked-in` |
| Safety | Double check-in blocked atomically; wrong-event, invalid and unknown codes rejected |
| Dashboard | Registered / checked-in / remaining, progress bar, checked-in list with timestamps, live over Socket.IO |
| Student side | Open the event link, enter roll number or email, get a QR pass page (with backup code and download) |

## Project structure

```
campus-event-checkin/
├── server/               Express API
│   └── src/
│       ├── config/       env + MongoDB connection
│       ├── models/       Organizer, Event, Student
│       ├── middleware/   auth (JWT + role), ownEvent, error handling
│       ├── controllers/  auth, events, students, checkin, public
│       ├── routes/       all API routes
│       ├── services/     stats helpers
│       ├── utils/        code generation / QR payload parsing
│       ├── socket.js     authenticated Socket.IO rooms per event
│       └── index.js
├── client/               React + Vite + Tailwind
│   └── src/
│       ├── pages/        Login, Register, Events, CreateEvent, EventDetail, EventLookup, StudentPass
│       ├── components/   DashboardTab, StudentsTab, CheckinTab, Navbar, ProtectedRoute, ui
│       ├── hooks/        useEventLive (stats + socket)
│       ├── context/      AuthContext
│       └── lib/          api (axios), socket, format
└── sample-students.csv   Try the bulk upload with this
```

## Run locally

Prerequisites: Node 18+ and a MongoDB instance (local, or a free MongoDB Atlas cluster).

```bash
# 1. Backend
cd server
cp .env.example .env        # then edit MONGODB_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

### Quick demo flow
1. Register an organizer → create an event.
2. **Students** tab → upload `sample-students.csv` (or add students by hand).
3. Click **QR** next to a student to open their pass in a new tab (this is what a student would show).
4. **Check-in** tab → *Start camera* and scan the QR from another screen, or type the backup code.
5. Scan the same QR again → "Already checked in" (no double count).
6. Open the **Live dashboard** in a second window and watch the numbers update instantly.

## API reference

All organizer routes need `Authorization: Bearer <token>`. Errors are `{ "message": "..." }`.

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | current organizer |
| GET / POST | `/api/events` | list (with counts) / create |
| GET / DELETE | `/api/events/:eventId` | owner only |
| GET | `/api/events/:eventId/stats` | `{ total, checkedIn, remaining }` |
| GET / POST | `/api/events/:eventId/students` | list (`?status=&q=`) / add |
| POST | `/api/events/:eventId/students/bulk` | `{ csv }` text |
| DELETE | `/api/events/:eventId/students/:studentId` | only if not checked in |
| POST | `/api/events/:eventId/checkin` | `{ code }` — QR payload or manual code. 200 ok · 400 invalid/wrong event · 404 unknown · 409 already checked in |
| GET | `/api/public/events/:eventId` | public event summary |
| POST | `/api/public/events/:eventId/lookup` | `{ identifier }` roll no. or email → `{ code }` |
| GET | `/api/public/pass/:code` | student, event and QR image (data URL) |

Socket.IO: organizers connect with their JWT, emit `event:join` with an event ID they own, and receive `attendance:update` `{ student, stats }`.

## Design notes (engineering points)

- **Role-based access:** `requireAuth` + `requireRole('organizer')` guard every organizer route; `ownEvent` ensures an organizer can only touch their own events. Sockets are authenticated and room joins verify ownership.
- **Unique codes:** 10-char random hex per student (DB unique index), plus a unique `(event, rollNumber)` index so a student can't be registered twice for an event.
- **No double check-in:** check-in is a single atomic `findOneAndUpdate` filtered on `status: 'registered'`, so two scanners hitting the same code simultaneously can't both succeed.
- **Status management:** `registered → checked-in` with `checkedInAt` and `checkedInBy` recorded.
- **Error handling:** one error middleware maps validation, duplicate-key, cast and JWT problems to clean JSON; UI shows loading, success, warning and error states.
- **Passwords:** hashed with `bcryptjs` (pure-JS, API-compatible with `bcrypt`, avoids native build issues on Render).

## Deployment

**Backend → Render (Web Service)**
- Root directory: `server` · Build: `npm install` · Start: `npm start`
- Environment: `MONGODB_URI` (Atlas connection string), `JWT_SECRET`, `CLIENT_URL` (your Vercel URL, no trailing slash)
- Health check path: `/health`

**Frontend → Vercel**
- Root directory: `client` · Framework: Vite
- Environment: `VITE_API_URL` = your Render URL (e.g. `https://campus-checkin-api.onrender.com`)
- `client/vercel.json` already rewrites all routes to `index.html` so `/pass/...` and `/e/...` links work.

Camera scanning requires HTTPS, which Vercel provides. Render's free tier sleeps when idle, so open the API URL once before a demo.

## Known limitations (MVP trade-offs)

- Student lookup uses roll number or email without a password. It is rate-limited, but anyone who knows a roll number could open that student's pass. For stricter setups, send each student their private `/pass/<code>` link instead of sharing the event link.
- Out of scope by design: payments, public ticketing, email notifications, advanced analytics, native mobile app.

## Demo video checklist

Drive Link - https://drive.google.com/file/d/1eVkD0Twdrr3MKRYPyKibSOlqRfjEr-MB/view?usp=drivesdk

## Vercel Live Link

Link - https://campus-event-checkin.vercel.app/
