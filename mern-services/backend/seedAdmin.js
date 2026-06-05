require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: "admin@quickserve.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hash = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin",
    email: "admin@quickserve.com",
    password: hash,
    role: "admin",
  });

  console.log("✅ Admin created: admin@quickserve.com / admin123");
  process.exit();
}

seed().catch((err) => { console.error(err); process.exit(1); });