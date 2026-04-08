const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
require("./config/db");

const User = require("./models/User");
const Candidate = require("./models/Candidate");

async function seed() {
  try {
    console.log("🌱 Seeding test accounts...");

    // 1. Candidate
    const candidateEmail = "candidate@test.com";
    let candUser = await User.findOne({ email: candidateEmail });
    if (!candUser) {
      const hashed = await bcrypt.hash("Password123", 10);
      const candidateProfile = await Candidate.create({
        name: "Test Candidate",
        age: 25,
        skills: ["React", "Node.js", "Blockchain"],
        score: 0
      });
      candUser = new User({
        email: candidateEmail,
        password: hashed,
        role: "candidate",
        candidateId: candidateProfile._id
      });
      await candUser.save();
      console.log(`✅ Candidate created: ${candidateEmail}`);
    } else {
      console.log(`ℹ️ Candidate already exists: ${candidateEmail}`);
    }

    // 2. Recruiter
    const recruiterEmail = "recruiter@test.com";
    let recUser = await User.findOne({ email: recruiterEmail });
    if (!recUser) {
      const hashed = await bcrypt.hash("Password123", 10);
      recUser = new User({
        email: recruiterEmail,
        password: hashed,
        role: "recruiter"
      });
      await recUser.save();
      console.log(`✅ Recruiter created: ${recruiterEmail}`);
    } else {
      console.log(`ℹ️ Recruiter already exists: ${recruiterEmail}`);
    }

    console.log("🚀 Seeding complete! You can now log in with Password123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
