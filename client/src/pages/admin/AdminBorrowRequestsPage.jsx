import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

const statuses = ['pending', 'approved', 'returned', 'late'];

const displayDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export default function AdminBorrowRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/api/borrow-requests', { signal: controller.signal })
      .then((payload) => setRequests(payload.data || []))
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

  const updateStatus = async (request, status) => {
    setUpdatingId(request._id);
    setError('');
    try {
      const payload = await apiRequest(`/api/borrow-requests/${request._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRequests((current) => current.map((entry) => (entry._id === request._id ? payload.data : entry)));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Librarian tools</p>
        <h1>Borrow requests</h1>
      </header>
      {loading ? (
        <div className="state state--loading">Loading borrow requests…</div>
      ) : error && requests.length === 0 ? (
        <div className="state state--error" role="alert">{error}</div>
      ) : requests.length === 0 ? (
        <div className="state state--empty">There are no borrow requests yet.</div>
      ) : (
        <>
          {error && <div className="state state--error" role="alert">{error}</div>}
          <div className="admin-panel admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Book</th><th>Patron</th><th>Requested</th><th>Due</th><th>Returned</th><th>Fine</th><th>Status</th></tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.book?.title || 'Unknown book'}</td>
                    <td>{request.user?.username || 'Patron'}</td>
                    <td>{displayDate(request.requestedAt)}</td>
                    <td>{displayDate(request.dueAt)}</td>
                    <td>{displayDate(request.returnedAt)}</td>
                    <td>${Number(request.fine || 0).toFixed(2)}</td>
                    <td>
                      <select
                        aria-label={`Status for ${request.book?.title || 'borrow request'}`}
                        value={request.status}
                        disabled={updatingId === request._id}
                        onChange={(event) => updateStatus(request, event.target.value)}
                      >
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
