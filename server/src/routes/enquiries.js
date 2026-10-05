const express = require("express");
const rateLimit = require("express-rate-limit");
const Enquiry = require("../models/Enquiry");

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many enquiries from this device. Please try again later." },
});

router.post("/", submitLimiter, async (req, res, next) => {
  try {
    const { name, phone, quantity, purpose } = req.body;
    await Enquiry.create({ name, phone, quantity, purpose });
    res.status(201).json({ message: "Enquiry received." });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = {};
      for (const [field, detail] of Object.entries(error.errors)) {
        errors[field] = detail.name === "CastError" ? `${field} is not valid` : detail.message;
      }
      return res.status(400).json({ message: "Please check the form and try again.", errors });
    }
    next(error);
  }
});

module.exports = router;
