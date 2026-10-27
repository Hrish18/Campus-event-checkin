import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

/** Only logged-in organizers get through; everyone else is sent to /login. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user || user.role !== 'organizer') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
