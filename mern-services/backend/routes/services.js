const express = require("express");
const Service = require("../models/Service");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/services?category=X  — public, only approved services
router.get("/", async (req, res) => {
  try {
    const filter = { approved: true };
    if (req.query.category) filter.category = req.query.category;
    const services = await Service.find(filter).populate("provider", "name email");
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/services/mine/list  — provider: their own services
router.get("/mine/list", auth, requireRole("provider", "admin"), async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id }).populate("provider", "name email");
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/services/:id  — public, single service
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("provider", "name email");
    if (!service) return res.status(404).json({ msg: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/services  — provider creates a service (starts unapproved)
router.post("/", auth, requireRole("provider", "admin"), async (req, res) => {
  try {
    const { title, description, category, subCategory, price } = req.body;
    const service = await Service.create({
      title,
      description,
      category,
      subCategory,
      price,
      provider: req.user._id,
      approved: false,
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PUT /api/services/:id  — provider edits their own service (resets to unapproved)
router.put("/:id", auth, requireRole("provider", "admin"), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: "Service not found" });
    if (req.user.role !== "admin" && String(service.provider) !== String(req.user._id))
      return res.status(403).json({ msg: "Not your service" });

    const { title, description, category, subCategory, price } = req.body;
    Object.assign(service, { title, description, category, subCategory, price, approved: false });
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE /api/services/:id  — provider deletes their own service
router.delete("/:id", auth, requireRole("provider", "admin"), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: "Service not found" });
    if (req.user.role !== "admin" && String(service.provider) !== String(req.user._id))
      return res.status(403).json({ msg: "Not your service" });

    await service.deleteOne();
    res.json({ msg: "Service deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
