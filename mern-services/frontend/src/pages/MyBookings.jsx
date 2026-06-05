import { useEffect, useState } from "react";
import api from "../api";

const STATUS_COLORS = {
  pending: "status-pending",
  accepted: "status-accepted",
  completed: "status-completed",
  cancelled: "status-cancelled",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    api.get("/bookings/mine")
      .then((r) => setBookings(r.data))
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await api.put(`/bookings/${id}/status`, { status: "cancelled" });
      load();
    } catch (e) {
      alert(e.response?.data?.msg || "Could not cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track and manage your service requests</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-placeholder">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>You haven't booked any services yet.</p>
          <a href="/" className="btn-primary">Browse services</a>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card-row">
              <div className="booking-info">
                <div className="booking-service-name">{b.service?.title || "N/A"}</div>
                <div className="booking-provider">by {b.service?.provider?.name || "N/A"}</div>
                <div className="booking-meta">
                  <span>📅 {b.date ? new Date(b.date).toLocaleDateString("en-PK", { dateStyle: "medium" }) : "N/A"}</span>
                  <span>📍 {b.address}</span>
                  <span>📞 {b.phone}</span>
                </div>
              </div>
              <div className="booking-status-col">
                <span className={`status-badge ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                {b.status === "pending" && (
                  <button
                    className="btn-cancel"
                    onClick={() => cancelBooking(b._id)}
                    disabled={cancelling === b._id}
                  >
                    {cancelling === b._id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
