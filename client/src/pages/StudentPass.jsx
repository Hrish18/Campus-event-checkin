
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Alert, Spinner } from '../components/ui.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function StudentPass() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [pass, setPass] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateQR = useCallback(async () => {
    const token = sessionStorage.getItem(
      `student_token_${eventId}`
    );

    if (!token) {
      navigate(`/e/${eventId}`, { replace: true });
      return;
    }

    setLoading(true);
    setError('');
    setPass(null);

    try {
      // Use a separate Axios request so the organizer's
      // authentication interceptor cannot override
      // the student's token.
      const { data } = await axios.post(
        `${API_URL}/api/public/events/${eventId}/generate-qr`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPass(data);

      setRemaining(
        Math.max(
          0,
          Math.ceil((data.expiresAt - Date.now()) / 1000)
        )
      );

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate QR code';

      setError(message);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        sessionStorage.removeItem(
          `student_token_${eventId}`
        );
      }

    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  // Generate QR after student login
  useEffect(() => {
    generateQR();
  }, [generateQR]);

  // Update countdown timer
  useEffect(() => {
    if (!pass) return;

    const timer = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil(
          (pass.expiresAt - Date.now()) / 1000
        )
      );

      setRemaining(seconds);
    }, 250);

    return () => clearInterval(timer);
  }, [pass]);

  const expired = remaining === 0;

  function logout() {
    sessionStorage.removeItem(
      `student_token_${eventId}`
    );

    navigate(`/e/${eventId}`, {
      replace: true
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card space-y-4 text-center">

        <h1 className="text-xl font-bold">
          Student Entry Pass
        </h1>

        {error && (
          <Alert type="error">
            {error}
          </Alert>
        )}

        {loading && (
          <Spinner label="Generating QR code..." />
        )}

        {pass && (
          <>
            <div>
              <p className="font-semibold">
                {pass.student.name}
              </p>

              <p className="text-sm text-slate-500">
                {pass.student.rollNumber}
              </p>
            </div>

            <div className="relative flex justify-center">

              <img
                src={pass.qrDataUrl}
                alt="Temporary student QR code"
                className={`h-64 w-64 ${expired ? 'opacity-20' : ''
                  }`}
              />

              {expired && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded bg-red-100 p-3 font-bold text-red-700">
                    QR Expired
                  </span>
                </div>
              )}

            </div>

            <p className="text-sm text-slate-500">
              QR Code Expires In
            </p>

            <p
              className={`text-4xl font-bold ${remaining <= 10
                  ? 'text-red-600'
                  : 'text-indigo-600'
                }`}
            >
              {remaining}s
            </p>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${remaining <= 10
                    ? 'bg-red-500'
                    : 'bg-indigo-600'
                  }`}
                style={{
                  width: `${Math.min(100, remaining / 60 * 100)}%`
                }}
              />
            </div>

            <p className="text-sm">
              {expired
                ? 'QR code has expired. Generate a new one.'
                : 'Show this QR to the organizer before it expires.'}
            </p>
          </>
        )}

        <button
          className="btn-primary w-full"
          onClick={generateQR}
          disabled={
            loading ||
            (!!pass && !expired)
          }
        >
          {loading
            ? 'Generating...'
            : pass && !expired
              ? 'QR Code Active'
              : 'Generate New QR Code'}
        </button>

        <button
          className="btn-secondary w-full"
          onClick={logout}
        >
          Logout
        </button>

      </div>
    </div>
  );
}
