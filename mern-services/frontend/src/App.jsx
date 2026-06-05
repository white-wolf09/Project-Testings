import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ServiceDetails from "./pages/ServiceDetails.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Provider from "./pages/Provider.jsx";
import Admin from "./pages/Admin.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Protected Route Component (For Access Control)
function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container" style={{textAlign:"center",paddingTop:"4rem",color:"var(--text-secondary)"}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    /* Inline CSS styles taaki footer bottom par lock ho jaye */
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      
      {/* flexGrow: 1 bachi hui saari jagah le lega aur footer ko niche push kar dega */}
      <main style={{ flexGrow: 1, width: "100%" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          
          {/* Normal Booking Routes */}
          <Route path="/my-bookings" element={<Protected roles={["user", "provider", "admin"]}><MyBookings /></Protected>} />
          
          {/* FIX: Provider Dashboard Route ko bilkul direct aur simple kar diya hai */}
          <Route path="/provider" element={<Protected roles={["provider", "admin"]}><Provider /></Protected>} />
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<Protected roles={["admin"]}><Admin /></Protected>} />
          
          {/* Fallback Catch All */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}