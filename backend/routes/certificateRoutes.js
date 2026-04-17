const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");

const Certificate = require("../models/Certificate");
const Candidate = require("../models/Candidate");
const { certificateChain } = require("./../blockchain/blockchain.js");

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, "cert-" + Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* =========================
   UPLOAD & VERIFY CERTIFICATE
========================= */

router.post("/upload", upload.single("certificate"), async (req, res) => {

  try {

    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No certificate file uploaded" });
    }

    /* Hash the file contents */
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    /* Check for duplicate */
    const existing = await certificateChain.findCertificate(fileHash);
    if (existing) {
      return res.status(409).json({
        error: "This certificate is already verified on the blockchain",
        blockHash: existing.hash,
        blockIndex: existing.index
      });
    }

    /* Mine a new block with the certificate hash */
    const block = await certificateChain.addBlock({
      certificateHash: fileHash,
      candidateId,
      fileName: req.file.originalname
    });

    /* Save to MongoDB */
    const certificate = await Certificate.create({
      candidateId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileHash,
      blockHash: block.hash,
      blockIndex: block.index,
      verified: true
    });

    /* Re-calculate certificate bonus for this candidate */
    const certCount = await Certificate.countDocuments({ candidateId, verified: true });
    const certificateBonus = Math.min(certCount * 5, 25);

    await Candidate.findByIdAndUpdate(candidateId, { certificateBonus });

    res.json({
      message: "Certificate verified and stored on blockchain",
      certificate,
      block: {
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        nonce: block.nonce
      },
      certificateBonus,
      chainValid: certificateChain.isChainValid()
    });

  } catch (err) {
    console.error("CERTIFICATE UPLOAD ERROR:", err);
    res.status(500).json({ error: "Certificate upload failed" });
  }

});

/* =========================
   LIST CERTIFICATES
========================= */

router.get("/list/:candidateId", async (req, res) => {

  try {

    const certificates = await Certificate.find({
      candidateId: req.params.candidateId
    }).sort({ uploadedAt: -1 });

    res.json(certificates);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }

});

/* =========================
   VERIFY A SINGLE CERTIFICATE
   (re-check it exists on-chain)
========================= */

router.get("/verify/:certificateId", async (req, res) => {

  try {

    const cert = await Certificate.findById(req.params.certificateId);
    if (!cert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    const block = await certificateChain.findCertificate(cert.fileHash);
    const chainValid = await certificateChain.isChainValid();

    res.json({
      verified: !!block,
      chainValid,
      certificate: cert,
      block: block
        ? { index: block.index, hash: block.hash, nonce: block.nonce }
        : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }

});

/* =========================
   VIEW FULL BLOCKCHAIN
   (transparency / debug)
========================= */

router.get("/chain", async (req, res) => {

  res.json({
    length: (await certificateChain.getChain()).length,
    valid: await certificateChain.isChainValid(),
    blocks: await certificateChain.getChain()
  });

});

/* =========================
   DELETE CERTIFICATE
========================= */

router.delete("/:certificateId", async (req, res) => {

  try {

    const cert = await Certificate.findByIdAndDelete(req.params.certificateId);
    if (!cert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    /* Recalculate bonus */
    const certCount = await Certificate.countDocuments({
      candidateId: cert.candidateId,
      verified: true
    });
    const certificateBonus = Math.min(certCount * 5, 25);
    await Candidate.findByIdAndUpdate(cert.candidateId, { certificateBonus });

    res.json({ message: "Certificate removed", certificateBonus });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete certificate" });
  }

});

module.exports = router;
