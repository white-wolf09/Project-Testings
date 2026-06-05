const express = require("express");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

// User books a service (users only — providers cannot book)
router.post("/", auth, async (req, res) => {
  try {
    const { serviceId, address, phone, date } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ msg: "Service not found" });

    // Prevent provider from booking their own service
    if (String(service.provider) === String(req.user._id)) {
      return res.status(403).json({ msg: "You cannot book your own service" });
    }

    const booking = await Booking.create({
      service: serviceId, user: req.user._id, address, phone, date,
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// User: my bookings
router.get("/mine", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({ path: "service", populate: { path: "provider", select: "name email" } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Provider: bookings on my services
router.get("/provider", auth, requireRole("provider", "admin"), async (req, res) => {
  try {
    const myServices = await Service.find({ provider: req.user._id }).select("_id");
    const ids = myServices.map((s) => s._id);
    const bookings = await Booking.find({ service: { $in: ids } })
      .populate("service")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update booking status — provider/admin can accept/complete/cancel
// Users can only cancel their own pending bookings
router.put("/:id/status", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("service");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    const isOwner = String(booking.user) === String(req.user._id);
    const isProvider = req.user.role === "provider" && String(booking.service.provider) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isProvider && !isAdmin) {
      return res.status(403).json({ msg: "Not authorized to update this booking" });
    }

    // Users can only cancel their own bookings
    if (isOwner && !isProvider && !isAdmin) {
      if (req.body.status !== "cancelled") {
        return res.status(403).json({ msg: "You can only cancel your own bookings" });
      }
      if (booking.status !== "pending") {
        return res.status(400).json({ msg: "Only pending bookings can be cancelled" });
      }
    }

    booking.status = req.body.status || booking.status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
