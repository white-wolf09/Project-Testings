import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_COLORS = {
  pending: "status-pending", accepted: "status-accepted",
  completed: "status-completed", cancelled: "status-cancelled",
};

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");

  const load = () => {
    api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => setError("Failed to load data"));
    api.get("/admin/services").then((r) => setServices(r.data)).catch(() => {});
    api.get("/admin/bookings").then((r) => setBookings(r.data)).catch(() => {});
  };

  useEffect(load, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      load();
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to change role");
    }
  };

  const delUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to delete user");
    }
  };

  const delService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/admin/services/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to delete service");
    }
  };

  const approveService = async (id) => {
    try {
      await api.put(`/admin/services/${id}/approve`);
      load();
    } catch (e) { setError(e.response?.data?.msg || "Failed"); }
  };

  const rejectService = async (id) => {
    try {
      await api.put(`/admin/services/${id}/reject`);
      load();
    } catch (e) { setError(e.response?.data?.msg || "Failed"); }
  };

  // Derived stats
  const providerCount = users.filter(u => u.role === "provider").length;
  const customerCount = users.filter(u => u.role === "user").length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const pendingServices = services.filter(s => !s.approved).length;
  const completedBookings = bookings.filter(b => b.status === "completed").length;

  return (
    <div className="page-container">
      {/* Admin Header — clearly different from provider */}
      <div className="admin-header-banner">
        <div>
          <div className="admin-badge-row">
            <span className="admin-crown">👑</span>
            <span className="admin-role-label">Admin Control Panel</span>
          </div>
          <h1 className="page-title">System Overview</h1>
          <p className="page-subtitle">Logged in as {currentUser?.name} · Full access</p>
        </div>
      </div>

      {/* System Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-blue">👥</div>
          <div>
            <div className="admin-stat-num">{users.length}</div>
            <div className="admin-stat-label">Total Users</div>
            <div className="admin-stat-sub">{customerCount} customers · {providerCount} providers</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-green">🛠️</div>
          <div>
            <div className="admin-stat-num">{services.length}</div>
            <div className="admin-stat-label">Active Services</div>
            <div className="admin-stat-sub">Across all providers</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-amber">📋</div>
          <div>
            <div className="admin-stat-num">{bookings.length}</div>
            <div className="admin-stat-label">Total Bookings</div>
            <div className="admin-stat-sub">{pendingBookings} pending · {completedBookings} completed</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "users" ? "tab-active" : ""}`} onClick={() => setActiveTab("users")}>
          👥 Users ({users.length})
        </button>
        <button className={`tab ${activeTab === "services" ? "tab-active" : ""}`} onClick={() => setActiveTab("services")}>
          🛠️ Services ({services.length})
          {pendingServices > 0 && <span className="tab-badge">{pendingServices}</span>}
        </button>
        <button className={`tab ${activeTab === "bookings" ? "tab-active" : ""}`} onClick={() => setActiveTab("bookings")}>
          📋 Bookings ({bookings.length})
          {pendingBookings > 0 && <span className="tab-badge">{pendingBookings}</span>}
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Provider Type</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = String(u._id) === String(currentUser?._id || currentUser?.id);
                  return (
                    <tr key={u._id} className={isSelf ? "row-self" : ""}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="table-avatar">{u.name?.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                            {isSelf && <span className="you-badge">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{u.email}</td>
                      <td className="td-muted">{u.providerType || "—"}</td>
                      <td>
                        <select
                          className="status-select"
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                          disabled={isSelf}
                          title={isSelf ? "Cannot change your own role" : "Change role"}
                        >
                          <option value="user">User</option>
                          <option value="provider">Provider</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-sm btn-delete"
                          onClick={() => delUser(u._id)}
                          disabled={isSelf}
                          title={isSelf ? "Cannot delete your own account" : "Delete user"}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan="5" className="empty-row">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="panel">
          {services.filter(s => !s.approved).length > 0 && (
            <div className="alert alert-pending-notice">
              ⏳ {services.filter(s => !s.approved).length} service(s) awaiting your approval
            </div>
          )}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Service</th><th>Category</th><th>Price</th><th>Provider</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className={!s.approved ? "row-pending" : ""}>
                    <td style={{ fontWeight: 500 }}>{s.title}</td>
                    <td><span className="card-badge">{s.category}</span></td>
                    <td>₹{s.price}</td>
                    <td className="td-muted">{s.provider?.name || "N/A"}</td>
                    <td>
                      <span className={s.approved ? "approval-badge approved" : "approval-badge pending"}>
                        {s.approved ? "✅ Live" : "⏳ Pending"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {!s.approved
                        ? <button className="btn-sm btn-approve" onClick={() => approveService(s._id)}>Approve</button>
                        : <button className="btn-sm btn-reject" onClick={() => rejectService(s._id)}>Revoke</button>
                      }
                      <button className="btn-sm btn-delete" onClick={() => delService(s._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && <tr><td colSpan="6" className="empty-row">No services found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Service</th><th>Customer</th><th>Provider</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 500 }}>{b.service?.title || "N/A"}</td>
                    <td className="td-muted">{b.user?.name || "N/A"}</td>
                    <td className="td-muted">{b.service?.provider?.name || "N/A"}</td>
                    <td>{b.date ? new Date(b.date).toLocaleDateString("en-PK", { dateStyle: "medium" }) : "N/A"}</td>
                    <td><span className={`status-badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan="5" className="empty-row">No bookings found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
