import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../categories.js";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    providerType: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.role === "provider" && !form.providerType) {
      return setError("Please select your service type");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const user = await register(form);
      // Redirect based on the role returned from the server
      if (user.role === "admin") {
        nav("/admin");
      } else if (user.role === "provider") {
        nav("/provider");
      } else {
        nav("/");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">QuickServe</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join QuickServe today</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>

          {/* Account type toggle */}
          <div className="form-group">
            <label className="form-label">Account type</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${form.role === "user" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "user", providerType: "" })}
              >
                Customer
              </button>
              <button
                type="button"
                className={`role-btn ${form.role === "provider" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "provider", providerType: "" })}
              >
                Service Provider
              </button>
            </div>
          </div>

          {/* Provider type — only shown for providers */}
          {form.role === "provider" && (
            <div className="form-group">
              <label className="form-label">Service type</label>
              <select
                className="form-input"
                value={form.providerType}
                onChange={(e) => setForm({ ...form, providerType: e.target.value })}
                required
              >
                <option value="">Select your service type</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
