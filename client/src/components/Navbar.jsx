import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to={user ? '/' : '/login'} className="text-lg font-bold text-indigo-600">
          CampusEvent <span className="text-slate-800">Check-in</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-slate-600 hover:text-slate-900">
              My events
            </Link>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
