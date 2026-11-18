import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/api/bookings', { signal: controller.signal })
      .then((payload) => setBookings(payload.data || []))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Librarian tools</p>
        <h1>Space bookings</h1>
      </header>
      {loading ? (
        <div className="state state--loading">Loading space bookings…</div>
      ) : error ? (
        <div className="state state--error" role="alert">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="state state--empty">There are no space bookings yet.</div>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Space</th><th>Date</th><th>Time</th><th>Booked by</th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.space}</td>
                  <td>{booking.date}</td>
                  <td>{booking.startTime}–{booking.endTime}</td>
                  <td>{booking.user?.username || 'Patron'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
