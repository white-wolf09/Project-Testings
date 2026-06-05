import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Use AuthContext login — it calls the API, saves token, sets user state
      const user = await login(email, password);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "provider") {
        navigate("/provider");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f172a", fontWeight: "700" }}>Account Login</h2>

      {error && (
        <div style={{ color: "#ef4444", background: "#fef2f2", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center", fontSize: "0.9rem", border: "1px solid #fee2e2" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "0.9rem" }}>Email Address</label>
          <input
            type="email"
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "0.9rem" }}>Password</label>
          <input
            type="password"
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ background: "#2563eb", color: "#fff", padding: "12px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", marginTop: "5px", fontSize: "0.95rem" }}
        >
          {loading ? "Signing in..." : "Login Now"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "#64748b" }}>
        Don't have an account?{" "}
        <Link to="/register" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>Create account here</Link>
      </p>
    </div>
  );
}
