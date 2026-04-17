const express = require("express");
const router = express.Router();
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const Registry = require("../models/Registry");
const { certificateChain } = require("./../blockchain/blockchain.js");


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-official-" + file.originalname)
});
const upload = multer({ storage });

// Issue Certificate (Register on Blockchain)
router.post(
  "/issue",
  upload.single("certificate"),
  async (req, res) => {
    try {
      const { title, recipient } = req.body;
      if (!req.file) return res.status(400).json({ message: "No document provided" });

      // Generate SHA-256 Hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      // Blockchain Check (Ensure not already registered)
      const existing = await certificateChain.findCertificate(fileHash);
      if (existing) {
        return res.status(409).json({ message: "This document fingerprint is already on the blockchain registry." });
      }

      // Register on Blockchain
      // We pass "OFFICIAL_ISSUER" as the candidateId label to mark it as source-verified
      const auditTrail = await certificateChain.addBlock({
        certificateHash: fileHash,
        candidateId: "OFFICIAL_ISSUER",
        fileName: req.file.originalname,
        title: title,
        recipient: recipient
      });

      // Save to Registry DB
      const registration = new Registry({
        title,
        recipient,
        fileHash,
        issuerId: null,
        onChain: true
      });
      await registration.save();

      res.json({
        message: "Certificate issued and secured on blockchain",
        fileHash,
        txHash: auditTrail.hash
      });
    } catch (err) {
      console.error("OFFICIAL ISSUANCE ERROR:", err.message);
      res.status(500).json({
        message: "Official issuance failed",
        error: err.message
      });
    }
  }
);

// Get Issuance History
router.get("/history", async (req, res) => {
  try {
    const history = await Registry.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

module.exports = router;
