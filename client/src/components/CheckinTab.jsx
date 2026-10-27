import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api, { getErrorMessage } from '../lib/api.js';

const RESULT_STYLES = {
  success: 'border-green-300 bg-green-50 text-green-900',
  duplicate: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
};
const RESULT_TITLES = { success: '✓ Checked in', duplicate: '⚠ Already checked in', error: '✕ Check-in failed' };

export default function CheckinTab({ eventId, live }) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);
  const lockRef = useRef(false);

  async function submit(raw, source) {
    if (!raw?.trim() || lockRef.current) return;
    lockRef.current = true; // ignore repeat reads of the same QR while one is in flight
    try {
      const { data } = await api.post(`/api/events/${eventId}/checkin`, { code: raw.trim() });
      setResult({ type: 'success', student: data.student, message: data.message });
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409) {
        setResult({ type: 'duplicate', student: data.student, message: data.message });
      } else {
        setResult({ type: 'error', message: getErrorMessage(err) });
      }
    } finally {
      // Short cooldown after camera reads so a QR held in frame isn't re-submitted.
      setTimeout(() => (lockRef.current = false), source === 'scan' ? 2000 : 0);
    }
  }

  // Always call the latest submit from inside the camera callback.
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (!scanning) return undefined;
    setCameraError('');
    const scanner = new Html5Qrcode('qr-reader');
    const started = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => submitRef.current(text, 'scan'),
        () => {}
      )
      .catch((err) => {
        setCameraError(
          typeof err === 'string' && err.includes('Permission')
            ? 'Camera permission denied. Allow camera access.'
            : 'Could not start the camera.'
        );
        setScanning(false);
      });

    return () => {
      started.then(() => scanner.stop()).then(() => scanner.clear()).catch(() => {});
    };
  }, [scanning]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div className="card space-y-3">
          <h2 className="font-semibold">Scan QR code</h2>
          <div id="qr-reader" className={scanning ? 'overflow-hidden rounded-lg' : 'hidden'} />
          {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
          <button className={scanning ? 'btn-secondary w-full' : 'btn-primary w-full'} onClick={() => setScanning((s) => !s)}>
            {scanning ? 'Stop camera' : 'Start camera'}
          </button>
          <p className="text-xs text-slate-500">Camera access needs HTTPS (or localhost). QR codes expire after 60 seconds.</p>
        </div>


      </div>

      <div className="space-y-6">
        <div className="card" aria-live="polite">
          <h2 className="mb-3 font-semibold">Result</h2>
          {!result ? (
            <p className="py-8 text-center text-sm text-slate-500">Scan a student QR code to check someone in.</p>
          ) : (
            <div className={`rounded-lg border p-4 ${RESULT_STYLES[result.type]}`}>
              <div className="text-lg font-bold">{RESULT_TITLES[result.type]}</div>
              {result.student && (
                <div className="mt-2">
                  <div className="text-base font-semibold">{result.student.name}</div>
                  <div className="text-sm">{result.student.rollNumber}</div>
                </div>
              )}
              <p className="mt-2 text-sm">{result.message}</p>
            </div>
          )}
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold tabular-nums">
            <span className="text-green-600">{live.stats.checkedIn}</span>
            <span className="text-slate-400"> / {live.stats.total}</span>
          </div>
          <div className="text-sm text-slate-500">checked in · {live.stats.remaining} remaining</div>
        </div>
      </div>
    </div>
  );
}
