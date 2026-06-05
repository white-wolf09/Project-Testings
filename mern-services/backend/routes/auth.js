const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, providerType } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    
    // FIX: Yahan 'admin' role ko allow kar diya hai
    const safeRole = ["user", "provider", "admin"].includes(role) ? role : "user";

    if (safeRole === "provider" && !providerType) {
      return res.status(400).json({ msg: "Provider type required" });
    }

    const user = await User.create({
      name, email, password: hash, role: safeRole,
      providerType: safeRole === "provider" ? providerType : null,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        providerType: user.providerType,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        providerType: user.providerType,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET CURRENT USER
router.get("/me", auth, (req, res) => res.json(req.user));

module.exports = router;