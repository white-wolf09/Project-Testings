# QuickServe — Online Service Provider Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for booking local home services.

## Features
- **Users**: Browse services, book by category, track/cancel bookings
- **Providers**: Register by service type, manage services, accept/update bookings
- **Admins**: Manage all users, services, and bookings

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/quickserve
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
```

Start the backend:
```bash
npm run dev   # development with nodemon
npm start     # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
mern-services/
├── backend/
│   ├── middleware/auth.js       # JWT auth + role middleware
│   ├── models/
│   │   ├── User.js              # User schema with validation
│   │   ├── Service.js           # Service listing schema
│   │   └── Booking.js           # Booking schema with Date validation
│   ├── routes/
│   │   ├── auth.js              # Register, Login, /me
│   │   ├── services.js          # CRUD for services
│   │   ├── bookings.js          # Create, view, update bookings
│   │   └── admin.js             # Admin-only management routes
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    └── src/
        ├── pages/               # All page components
        ├── components/Navbar.jsx
        ├── context/AuthContext.jsx
        ├── api.js               # Axios instance with interceptors
        └── styles.css           # Global design system
```

## User Roles

| Role | Access |
|---|---|
| `user` | Browse, book services, view/cancel own bookings |
| `provider` | All above + manage own services + update booking status |
| `admin` | Full access to all users, services, and bookings |

## Seeding an Admin User

There is no admin registration UI (by design). To create an admin:
1. Register a normal account
2. In MongoDB Atlas/Compass, change that user's `role` field to `"admin"`
