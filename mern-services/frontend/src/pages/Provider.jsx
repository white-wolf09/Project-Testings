import { useEffect, useState, useMemo } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../categories.js";

const STATUS_COLORS = {
  pending: "status-pending", 
  accepted: "status-accepted",
  completed: "status-completed", 
  cancelled: "status-cancelled",
};

// Automated Billing ke liye Dummy Tasks List (Aap isko badal bhi sakte hain)
const BILLING_TASKS = {
  Plumber: [
    { id: "p1", name: "Tap / Faucet Repairing", price: 500 },
    { id: "p2", name: "Leakage Fixing (Pipe)", price: 1200 },
    { id: "p3", name: "Water Tank Cleaning", price: 3000 },
    { id: "p4", name: "Bathroom Fitting Commode", price: 2500 }
  ],
  Electrician: [
    { id: "e1", name: "Ceiling Fan Repairing", price: 600 },
    { id: "e2", name: "Main DB Box Installation", price: 2000 },
    { id: "e3", name: "Short Circuit Fixing", price: 1500 },
    { id: "e4", name: "House Wiring (Per Point)", price: 350 }
  ],
  "AC Repair": [
    { id: "a1", name: "AC Gas Refilling", price: 4500 },
    { id: "a2", name: "Master Chemical Service", price: 1800 },
    { id: "a3", name: "AC Installation / Removal", price: 2500 }
  ]
};

export default function Provider() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: user?.providerType || "Plumber", subCategory: "", price: 0 });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("services");

  // Dynamic Billing System States
  const [selectedBookingForBill, setSelectedBookingForBill] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const load = () => {
    api.get("/services/mine/list")
      .then((r) => setServices(r.data))
      .catch(() => setError("Failed to load services"));
    api.get("/bookings/provider")
      .then((r) => setBookings(r.data))
      .catch(() => {});
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      if (editing) await api.put(`/services/${editing}`, form);
      else await api.post("/services", form);
      setSuccess(editing ? "✅ Service updated! Awaiting admin re-approval." : "✅ Service submitted! It will go live once an admin approves it.");
      setForm({ title: "", description: "", category: user?.providerType || "Plumber", subCategory: "", price: 0 });
      setEditing(null);
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to save service");
    }
  };

  const edit = (s) => {
    setEditing(s._id);
    setForm({ title: s.title, description: s.description, category: s.category, subCategory: s.subCategory || "", price: s.price });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to delete service");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      load();
    } catch (e) {
      setError(e.response?.data?.msg || "Failed to update status");
    }
  };

  // Automated Bill Handle Settings
  const handleTaskCheck = (task, isChecked) => {
    if (isChecked) {
      setSelectedTasks([...selectedTasks, task]);
    } else {
      setSelectedTasks(selectedTasks.filter(t => t.id !== task.id));
    }
  };

  const totalGeneratedBill = useMemo(() => {
    return selectedTasks.reduce((sum, task) => sum + task.price, 0);
  }, [selectedTasks]);

  const submitFinalBill = async (bookingId) => {
    if (totalGeneratedBill === 0) {
      alert("Please select at least one task to generate bill!");
      return;
    }
    try {
      // Backend ko final bill send karne ka api call
      await api.put(`/bookings/${bookingId}/status`, { 
        status: "completed", 
        finalBill: totalGeneratedBill,
        tasks: selectedTasks 
      });
      alert(`✅ Bill of Rs. ${totalGeneratedBill} generated successfully! Job Marked as Completed.`);
      setSelectedBookingForBill(null);
      setSelectedTasks([]);
      load();
    } catch (e) {
      setError("Failed to submit bill to customer");
    }
  };

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const earnedTotal = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + (b.finalBill || b.service?.price || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="provider-header">
        <div className="provider-header-left">
          <div className="provider-avatar-lg">{user?.name?.charAt(0)}</div>
          <div>
            <h1 className="page-title">{user?.name}</h1>
            <div className="provider-meta">
              <span className="provider-type-pill">
                🛠️ {user?.providerType || "Plumber"}
              </span>
              <span className="provider-role-pill">Provider Account</span>
            </div>
          </div>
        </div>
        <div className="stats-row">
          <div className="mini-stat">
            <span className="mini-stat-num">{services.length}</span>
            <span className="mini-stat-label">My Services</span>
          </div>
          <div className="mini-stat mini-stat-warning">
            <span className="mini-stat-num">{pendingCount}</span>
            <span className="mini-stat-label">Pending</span>
          </div>
          <div className="mini-stat mini-stat-success">
            {/* Currency Updated to Rs. */}
            <span className="mini-stat-num">Rs. {earnedTotal}</span>
            <span className="mini-stat-label">Total Earnings</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* AUTOMATED BILL GENERATOR MODAL/PANEL (Shows when clicking Generate Bill) */}
          {selectedBookingForBill ? (
            <div className="panel" style={{ border: "2px solid var(--primary)", backgroundColor: "#fbfcfe" }}>
              <h3 className="panel-title">🧾 Create Digital Bill</h3>
              <p className="panel-subtitle">Select the actual tasks you performed at <b>{selectedBookingForBill.user?.name}</b>'s house:</p>
              
              <div style={{ margin: "15px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                {(BILLING_TASKS[user?.providerType || "Plumber"] || BILLING_TASKS["Plumber"]).map(task => (
                  <label key={task.id} style={{ display: "flex", justifyContent: "between", alignItems: "center", padding: "10px", background: "#fff", borderRadius: "8px", border: "1px solid #eee", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleTaskCheck(task, e.target.checked)}
                        checked={selectedTasks.some(t => t.id === task.id)}
                      />
                      <span style={{ fontSize: "13px", fontWeight: "500" }}>{task.name}</span>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: "bold" }}>Rs. {task.price}</span>
                  </label>
                ))}
              </div>

              <div style={{ borderTop: "2px dashed #ccc", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", color: "#555" }}>Total Bill:</span>
                <span style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>Rs. {totalGeneratedBill}</span>
              </div>

              <div className="btn-group" style={{ marginTop: "15px" }}>
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => submitFinalBill(selectedBookingForBill._id)}>
                  🚀 Submit & Finish Job
                </button>
                <button className="btn-outline" style={{ width: "100%" }} onClick={() => { setSelectedBookingForBill(null); setSelectedTasks([]); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Regular Add/Edit form
            <div className="panel">
              <h3 className="panel-title">{editing ? "✏️ Edit Service" : "➕ Add New Service"}</h3>
              <p className="panel-subtitle">
                {editing ? "Update the details of your service listing." : "Create a new listing customers can discover and book."}
              </p>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={save}>
                <div className="form-group">
                  <label className="form-label">Service Title</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Expert Pipe Repair"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows="3"
                    placeholder="Describe what you offer..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "" })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (Rs.)</label>
                  <input
                    className="form-input"
                    type="number" min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div className="btn-group">
                  <button className="btn-primary" type="submit">
                    {editing ? "Update Service" : "Publish Service"}
                  </button>
                  {editing && (
                    <button type="button" className="btn-outline" onClick={() => {
                      setEditing(null);
                      setForm({ title: "", description: "", category: user?.providerType || "Plumber", subCategory: "", price: 0 });
                    }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </aside>

        {/* Main Content Areas */}
        <main className="main-content">
          <div className="tabs">
            <button className={`tab ${activeTab === "services" ? "tab-active" : ""}`} onClick={() => setActiveTab("services")}>
              My Services ({services.length})
            </button>
            <button className={`tab ${activeTab === "bookings" ? "tab-active" : ""}`} onClick={() => setActiveTab("bookings")}>
              Customer Bookings ({bookings.length})
              {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
            </button>
          </div>

          {activeTab === "services" && (
            <div className="panel">
              {services.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🛠️</span>
                  <p>No services yet. Add your first service using the form on the left.</p>
                </div>
              ) : (
                <div className="services-list-provider">
                  {services.map((s) => (
                    <div key={s._id} className="service-row">
                      <div className="service-row-info">
                        <div>
                          <div className="service-row-title">{s.title}</div>
                          <div className="service-row-desc">{s.description || "No description"}</div>
                        </div>
                        <span className="card-badge">{s.category}</span>
                      </div>
                      <div className="service-row-right">
                        <span className="service-row-price">Rs. {s.price}</span>
                        <span className={s.approved ? "approval-badge approved" : "approval-badge pending"}>
                          {s.approved ? "✅ Live" : "⏳ Pending"}
                        </span>
                        <button className="btn-sm btn-edit" onClick={() => edit(s)}>Edit</button>
                        <button className="btn-sm btn-delete" onClick={() => del(s._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="panel">
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <p>No bookings yet.</p>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((b) => (
                    <div key={b._id} className={`booking-card-row ${b.status === "pending" ? "booking-highlight" : ""}`}>
                      <div className="booking-info">
                        <div className="booking-service-name">{b.service?.title}</div>
                        <div className="booking-provider">
                          👤 {b.user?.name} &nbsp;·&nbsp; {b.user?.email}
                        </div>
                        <div className="booking-meta">
                          <span>📅 {b.date ? new Date(b.date).toLocaleDateString("en-PK", { dateStyle: "medium" }) : "N/A"}</span>
                          <span>📞 {b.phone}</span>
                          <span>📍 {b.address}</span>
                        </div>
                        {b.finalBill && (
                          <div style={{ marginTop: "8px", fontWeight: "bold", color: "green" }}>
                            💰 Charged Bill: Rs. {b.finalBill}
                          </div>
                        )}
                      </div>
                      <div className="booking-status-col">
                        <span className={`status-badge ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                        
                        <select
                          className="status-select"
                          value={b.status}
                          onChange={(e) => updateStatus(b._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* AGAR STATUS ACCEPTED HAI TO BILL GENERATE KARNE KA BUTTON DIKHAYEIN */}
                        {b.status === "accepted" && !b.finalBill && (
                          <button 
                            className="btn-sm btn-edit" 
                            style={{ marginTop: "10px", background: "orange", color: "#fff", border: "none" }}
                            onClick={() => {
                              setSelectedBookingForBill(b);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            🧮 Generate Bill
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}