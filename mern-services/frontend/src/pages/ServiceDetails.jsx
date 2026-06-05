import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const today = new Date().toISOString().split("T")[0];

export default function ServiceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [form, setForm] = useState({ address: "", phone: "", date: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api.get(`/services/${id}`)
      .then((r) => setS(r.data))
      .catch(() => setErr("Service not found"))
      .finally(() => setPageLoading(false));
  }, [id]);

  // Safely get user ID — handles both _id (from /auth/me) and id (older shape)
  const userId = user ? String(user._id || user.id || "") : "";
  const providerId = s ? String(s.provider?._id || s.provider?.id || "") : "";

  // Is this the provider who owns this service?
  const isOwnService = userId && providerId && userId === providerId;

  // Determine what panel to show
  const getBookingState = () => {
    if (!user) return "guest";               // not logged in
    if (isOwnService) return "own";          // provider viewing their own service
    if (user.role === "user") return "book"; // regular customer → show booking form
    return "provider-other";                 // provider viewing someone else's service
  };

  const bookingState = getBookingState();

  const book = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setLoading(true);
    try {
      await api.post("/bookings", { serviceId: id, ...form });
      setMsg("✅ Booking placed! Check 'My Bookings' for updates.");
      setForm({ address: "", phone: "", date: "" });
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to place booking");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="details-page">
      <div className="page-container"><div className="skeleton-card" style={{ height: 300 }} /></div>
    </div>
  );

  if (!s) return (
    <div className="details-page">
      <div className="page-container">
        <div className="empty-state">
          <span className="empty-icon">😕</span>
          <p>Service not found</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="details-page">
      <div className="details-container">
        {/* LEFT: Service Info */}
        <div className="details-info">
          <Link to="/" className="back-link">← Back to services</Link>
          <span className="detail-badge">{s.category}</span>
          <h1 className="details-title">{s.title}</h1>
          <p className="details-desc">{s.description}</p>

          <div className="price-box">
            <p className="price-label">Starting price</p>
            <p className="price-big">₹{s.price}</p>
          </div>

          <div className="provider-box">
            <div className="provider-avatar">{s.provider?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="provider-name">{s.provider?.name}</p>
              <p className="provider-email">{s.provider?.email}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Booking Panel */}
        <div className="booking-panel">

          {/* Not logged in */}
          {bookingState === "guest" && (
            <div className="book-cta">
              <div className="book-cta-icon">🔐</div>
              <h3>Ready to book?</h3>
              <p>Sign in to book this service instantly</p>
              <Link to="/login" className="btn-primary btn-full" style={{ display: "block", textAlign: "center" }}>
                Sign in to book
              </Link>
              <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "13px", color: "var(--text-muted)" }}>
                No account? <Link to="/register">Register free</Link>
              </p>
            </div>
          )}

          {/* Provider viewing their own service */}
          {bookingState === "own" && (
            <div className="book-cta">
              <div className="book-cta-icon">🏠</div>
              <h3>This is your service</h3>
              <p>You cannot book your own listing. Manage it from your dashboard.</p>
              <Link to="/provider" className="btn-outline btn-full" style={{ display: "block", textAlign: "center" }}>
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* Provider viewing someone else's service */}
          {bookingState === "provider-other" && (
            <div className="book-cta">
              <div className="book-cta-icon">ℹ️</div>
              <h3>Provider account</h3>
              <p>Service providers cannot place bookings. Switch to a customer account to book.</p>
            </div>
          )}

          {/* Regular customer — show booking form */}
          {bookingState === "book" && (
            <form className="booking-form" onSubmit={book}>
              <h3 className="form-heading">Book this service</h3>

              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-error">{err}</div>}

              <div className="form-group">
                <label className="form-label">Full Address</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Where should the provider go?"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <button className="btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? "Confirming..." : "Confirm Booking"}
              </button>
              <p className="booking-note">
                📋 You can track and cancel bookings from <Link to="/my-bookings">My Bookings</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
