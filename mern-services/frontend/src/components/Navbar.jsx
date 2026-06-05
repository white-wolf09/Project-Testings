import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      backgroundColor: "#0b111e",
      padding: "14px 5%",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      position: "sticky",
      top: 0,
      width: "100%",
      boxSizing: "border-box",
      zIndex: 9999,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      
      {/* Left Side: Logo Section */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "1.3rem", letterSpacing: "0.5px", display: "block" }}>
            ⚡ QuickServe
          </span>
          <span style={{ color: "#ffffff", opacity: "0.7", fontSize: "0.7rem", marginTop: "1px", display: "block" }}>
            Pakistan's Trusted Platform
          </span>
        </Link>
      </div>

      {/* Right Side Links: Sahi Balanced Spacing aur Pure White Text */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "20px", /* Sahi Medium Gap setup */
        marginLeft: "auto" 
      }}>
        
        <Link to="/" style={{ color: "#ffffff", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500", paddingRight: "5px" }}>
          Home
        </Link>

        {user ? (
          <>
            {user.role === "user" && (
              <Link to="/my-bookings" style={{ color: "#ffffff", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500" }}>
                My Bookings
              </Link>
            )}

            {user.role === "admin" && (
              <Link to="/admin" style={{ color: "#ffffff", textDecoration: "none", fontSize: "0.95rem", fontWeight: "600" }}>
                Admin Portal
              </Link>
            )}

            <button 
              onClick={handleLogoutClick} 
              style={{ 
                background: "none", 
                border: "none", 
                color: "#ffffff", 
                cursor: "pointer", 
                fontSize: "0.95rem", 
                fontWeight: "500",
                padding: 0,
                marginLeft: "5px"
              }}
            >
              Logout ({user.name})
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: "#ffffff", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500", paddingRight: "5px" }}>
              Sign In
            </Link>
            
            <Link to="/register" style={{ 
              backgroundColor: "#2563eb", 
              color: "#ffffff", 
              padding: "7px 15px", /* Get started button ka size normal medium kar diya */
              borderRadius: "6px", 
              textDecoration: "none", 
              fontSize: "0.9rem", 
              fontWeight: "500",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
              display: "inline-block"
            }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}