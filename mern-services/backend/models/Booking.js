const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: [true, "Address is required"] },
    phone: { type: String, required: [true, "Phone is required"] },
    date: {
      type: Date,
      required: [true, "Date is required"],
      validate: {
        validator: function (v) {
          return v >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "Booking date cannot be in the past",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
