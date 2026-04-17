const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ message: "Email is required" });

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await OTP.deleteMany({ email }); // Delete old OTPs for this email

  const otpRecord = new OTP({ email, otp });
  await otpRecord.save();

  console.log(`[DEV MODE] OTP generated for ${email}: ${otp}`);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Your OTP for Privacy-Preserving Recruitment System",
      text: `Welcome! Your verification OTP is: ${otp}\nIt is valid for 5 minutes.`,
    });
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP email (Continuing anyway for Dev):", error.message);
    res.json({ message: "OTP process initiated (check server log for dev code)" });
  }
});

router.post("/register", async (req, res) => {

  const { email, password, role, otp } = req.body;

  if (!email || !password || !role || !otp) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const validOtp = await OTP.findOne({ email, otp });
  if (!validOtp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, role });

  // Auto-create a blank Candidate document for candidate users
  if (role === "candidate") {
    const candidate = await Candidate.create({ name: "", age: 0, skills: [], score: 0 });
    user.candidateId = candidate._id;
  }

  await user.save();
  await OTP.deleteMany({ email }); // clear OTP
  res.json({ message: "User created" });
});

router.post("/login", async (req, res) => {
  console.log("Login attempt for:", req.body.email);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Login failed: User not found ->", email);
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Login failed: Invalid password for ->", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    // If candidate has no linked profile yet, create one now
    if (user.role === "candidate" && !user.candidateId) {
      const candidate = await Candidate.create({ name: "", age: 0, skills: [], score: 0 });
      user.candidateId = candidate._id;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey"
    );

    console.log("Login successful for:", email);
    res.json({
      token,
      role: user.role,
      userId: user._id,
      candidateId: user.candidateId ?? null
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;