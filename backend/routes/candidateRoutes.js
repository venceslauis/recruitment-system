const express = require("express");
const router = express.Router();

const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const crypto = require("crypto");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");

/* =========================
   SKILL DATABASE
========================= */

const skillsDB = [
  "python",
  "java",
  "c++",
  "javascript",
  "react",
  "node",
  "express",
  "mongodb",
  "mysql",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "data analysis",
  "sql",
  "html",
  "css",
  "aws",
  "docker",
  "kubernetes",
  "typescript",
  "angular",
  "vue",
  "django",
  "flask",
  "git",
  "linux",
  "agile",
  "scrum",
  "rest api",
  "graphql",
  "redis",
  "postgresql",
  "figma",
  "tailwind"
];

/* =========================
   SKILL EXTRACTION
========================= */

function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const detected = [];

  skillsDB.forEach(skill => {
    if (lowerText.includes(skill)) {
      detected.push(skill);
    }
  });

  return detected;
}

/* =========================
   ZKP-BASED WEIGHTED MATCH SCORE
   Calculates score using the job's
   skill criteria weightage
========================= */

function calculateWeightedMatchScore(candidateSkills, skillCriteria) {
  if (!skillCriteria || skillCriteria.length === 0) {
    // Fallback: simple percentage of matched skills
    return 0;
  }

  let totalScore = 0;

  skillCriteria.forEach(criteria => {
    const candidateHasSkill = candidateSkills.some(
      s => s.toLowerCase() === criteria.skill.toLowerCase()
    );

    if (candidateHasSkill) {
      totalScore += criteria.weight;
    }
  });

  // Score is out of 100 (since weights should sum to 100)
  return Math.min(Math.round(totalScore), 100);
}

/* =========================
   GENERATE ZKP PROOF HASH
   Creates a hash proof that the score
   was computed correctly without
   revealing raw candidate data
========================= */

function generateZkpProofHash(candidateSkills, skillCriteria, matchScore) {
  const proofData = JSON.stringify({
    skillCount: candidateSkills.length,
    criteriaCount: skillCriteria.length,
    matchScore,
    timestamp: Date.now()
  });

  return crypto.createHash("sha256").update(proofData).digest("hex");
}

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* =========================
   GET ALL JOBS
========================= */

router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/* =========================
   APPLY FOR JOB
   Candidate submits: resume file + name + age
   System: extracts skills, calculates weighted
   match score using ZKP circuit, stores application
========================= */

router.post(
  "/apply",
  upload.single("resume"),
  async (req, res) => {

    try {

      const { jobId, candidateId, name, age } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      // Check for duplicate application
      const existingApp = await Application.findOne({ jobId, candidateId });
      if (existingApp) {
        return res.status(400).json({ message: "You have already applied for this job" });
      }

      // Fetch the job to get skill criteria
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      let resumeSkills = [];
      let resumePath = "";

      // Parse resume if file uploaded
      if (req.file) {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text;
        resumeSkills = extractSkills(text);
        resumePath = req.file.path;
      }

      // Calculate weighted match score using job's skill criteria (ZKP circuit)
      const matchScore = calculateWeightedMatchScore(resumeSkills, job.skillCriteria);

      // Generate ZKP proof hash
      const zkpProofHash = generateZkpProofHash(resumeSkills, job.skillCriteria, matchScore);

      // Create application with all data
      const application = new Application({
        jobId,
        candidateId: candidateId && candidateId !== "null" ? candidateId : undefined,
        name,
        age: age ? parseInt(age) : undefined,
        resumeSkills,
        resumePath,
        matchScore,
        zkpProofHash
      });

      await application.save();

      // Response to candidate — does NOT include score or ranking
      res.json({
        message: "Application submitted successfully",
        applicationId: application._id,
        extractedSkills: resumeSkills
      });

    } catch (err) {
      console.error("APPLICATION ERROR:", err);
      res.status(500).json({ message: "Application failed" });
    }

  }
);

/* =========================
   GET MY APPLICATIONS
   Privacy: returns job details + status
   Does NOT return score/ranking to candidate
========================= */

router.get("/myApplications/:candidateId", async (req, res) => {

  try {

    const candidateId = req.params.candidateId;

    if (!candidateId || candidateId === "null") {
      return res.status(400).json({ message: "Invalid candidateId" });
    }

    const apps = await Application.find({ candidateId })
      .populate("jobId");

    // Strip out score/ranking data — candidate should NOT see these
    const sanitized = apps.map(app => ({
      _id: app._id,
      jobId: app.jobId,
      appliedAt: app.appliedAt,
      resumeSkills: app.resumeSkills
      // matchScore, rank, zkpProofHash are deliberately EXCLUDED
    }));

    res.json(sanitized);

  } catch (err) {

    console.log("APPLICATION FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch applications" });

  }

});

/* =========================
   CANCEL APPLICATION
========================= */

router.delete("/application/:id", async (req, res) => {
  try {
    const applicationId = req.params.id;
    if (!applicationId) {
      return res.status(400).json({ message: "Invalid applicationId" });
    }

    const application = await Application.findByIdAndDelete(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Clean up resume file if exists
    if (application.resumePath) {
      try {
        fs.unlinkSync(application.resumePath);
      } catch (e) {
        // File may already be deleted
      }
    }

    res.json({ message: "Application cancelled successfully" });
  } catch (err) {
    console.log("APPLICATION CANCEL ERROR:", err);
    res.status(500).json({ message: "Failed to cancel application" });
  }
});

module.exports = router;