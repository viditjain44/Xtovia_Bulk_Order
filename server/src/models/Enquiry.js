const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name is too short"],
      maxlength: [80, "Name is too long"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      match: [/^\+?[0-9][0-9\s-]{6,16}$/, "Phone number is not valid"],
    },
    quantity: {
      type: Number,
      required: [true, "Bulk quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
      maxlength: [500, "Purpose is too long"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
