const express = require("express");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(auth, requireRole("admin"));

// ===== USERS =====
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "provider", "admin"].includes(role))
      return res.status(400).json({ msg: "Invalid role" });
    const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!u) return res.status(404).json({ msg: "User not found" });
    res.json(u);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id))
      return res.status(400).json({ msg: "You cannot delete your own admin account" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ===== SERVICES =====

// All services (approved + pending) for admin view
router.get("/services", async (_req, res) => {
  try {
    const services = await Service.find().populate("provider", "name email");
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Approve a service
router.put("/services/:id/approve", async (req, res) => {
  try {
    const s = await Service.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate("provider", "name email");
    if (!s) return res.status(404).json({ msg: "Service not found" });
    res.json(s);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Reject (unapprove) a service
router.put("/services/:id/reject", async (req, res) => {
  try {
    const s = await Service.findByIdAndUpdate(
      req.params.id,
      { approved: false },
      { new: true }
    ).populate("provider", "name email");
    if (!s) return res.status(404).json({ msg: "Service not found" });
    res.json(s);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: "Service deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ===== BOOKINGS =====
router.get("/bookings", async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate({ path: "service", populate: { path: "provider", select: "name email" } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
