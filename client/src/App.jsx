import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Events from './pages/Events.jsx';
import CreateEvent from './pages/CreateEvent.jsx';
import EventDetail from './pages/EventDetail.jsx';
import EventLookup from './pages/EventLookup.jsx';
import StudentPass from './pages/StudentPass.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          {/* Organizer */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />

          {/* Student (public) */}
          <Route path="/e/:eventId" element={<EventLookup />} />
          <Route path="/pass/:eventId" element={<StudentPass />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
