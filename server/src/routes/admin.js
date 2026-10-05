const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Enquiry = require("../models/Enquiry");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

function passwordMatches(candidate) {
  const expected = crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD).digest();
  const actual = crypto.createHash("sha256").update(String(candidate ?? "")).digest();
  return crypto.timingSafeEqual(expected, actual);
}

router.post("/login", loginLimiter, (req, res) => {
  if (!passwordMatches(req.body.password)) {
    return res.status(401).json({ message: "Incorrect password." });
  }
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

router.get("/enquiries", requireAdmin, async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [enquiries, today, quantityTotals] = await Promise.all([
      Enquiry.find().sort({ createdAt: -1 }).lean(),
      Enquiry.countDocuments({ createdAt: { $gte: startOfToday } }),
      Enquiry.aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }]),
    ]);

    res.json({
      stats: {
        total: enquiries.length,
        today,
        totalQuantity: quantityTotals[0]?.total ?? 0,
      },
      enquiries,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
