const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {

  const { email, password, role } = req.body;

  const existing = await User.findOne({ email });

  if(existing){
    return res.status(400).json({message:"User already exists"});
  }

  const hashed = await bcrypt.hash(password,10);

  const user = new User({
    email,
    password:hashed,
    role
  });

  await user.save();

  res.json({message:"User created"});
});

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ id: user._id }, "secretkey");

  res.json({ token, role: user.role });

});

module.exports = router;