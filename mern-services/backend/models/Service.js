const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["Electronics", "Plumber", "Electrician", "AC Repair", "Cleaning", "Carpenter", "Other"],
      default: "Other",
    },
    subCategory: { type: String, default: "" },
    price: { type: Number, default: 0 },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
