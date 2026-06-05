import React from 'react';

const Footer = () => {
  // Styles Objects
  const footerStyle = {
    backgroundColor: '#111827',
    color: '#9ca3af',
    paddingTop: '2.5rem',
    paddingBottom: '1.5rem',
    width: '100%',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '30px'
  };

  const columnStyle = {
    flex: '1',
    minWidth: '250px',
    textAlign: 'left'
  };

  const headingStyle = {
    color: '#ffffff',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    marginTop: '0'
  };

  const listStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '0'
  };

  const listItemStyle = {
    marginBottom: '0.5rem',
    fontSize: '0.875rem'
  };

  const linkStyle = {
    color: '#9ca3af',
    textDecoration: 'none',
    transition: 'color 0.2s'
  };

  const providerLinkStyle = {
    color: '#60a5fa',
    textDecoration: 'underline',
    fontSize: '0.875rem'
  };

  const copyrightStyle = {
    borderTop: '1px solid #1f2937',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#9ca3af',
    width: '100%'
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        
        {/* Column 1: Brand Info */}
        <div style={columnStyle}>
          <h3 style={headingStyle}>⚡ QuickServe</h3>
          <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#9ca3af' }}>
            Pakistan's trusted platform for instant home services.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div style={columnStyle}>
          <h3 style={headingStyle}>Quick Links</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <a href="/home" style={linkStyle}>• Home</a>
            </li>
            <li style={listItemStyle}>
              <a href="/bookings" style={linkStyle}>• My Bookings</a>
            </li>
            <li style={listItemStyle}>
              <a href="/how-it-works" style={linkStyle}>• How it Works</a>
            </li>
          </ul>
        </div>

        {/* Column 3: Providers & Payments */}
        <div style={columnStyle}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={headingStyle}>For Providers</h3>
            <a href="/become-provider" style={providerLinkStyle}>
              Become a Provider
            </a>
          </div>
          
          <div>
            <h3 style={{ ...headingStyle, fontSize: '1rem', marginBottom: '0.5rem' }}>Payment Methods</h3>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              💳 📱 💵
            </div>
            <p style={{ fontSize: '0.75rem', margin: '0', color: '#9ca3af' }}>
              EasyPaisa, JazzCash, Bank Transfer, Cash on Service
            </p>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={copyrightStyle}>
          © 2026 QuickServe Pakistan. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;