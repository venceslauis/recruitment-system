const express = require("express");
const router = express.Router();
const multer = require("multer");
const tesseract = require("tesseract.js");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

router.post(
  "/apply",
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "certificate", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { 
        jobId, candidateId, name, email, phone, age, 
        experience, cgpa, degree, location, gender, 
        integrityAnswers 
      } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      const existingApp = await Application.findOne({ jobId, email });
      if (existingApp) {
        return res.status(400).json({ message: "You have already applied for this job" });
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // ELIGIBILITY CHECK (ZKP Validation mock)
      if (job.eligibility) {
        let isEligible = true;
        if (job.eligibility.experience && Number(experience) < job.eligibility.experience) isEligible = false;
        if (job.eligibility.cgpa && Number(cgpa) < job.eligibility.cgpa) isEligible = false;
        if (job.eligibility.age && Number(age) > job.eligibility.age) isEligible = false;
        if (job.eligibility.degree && degree?.toLowerCase() !== job.eligibility.degree.toLowerCase()) isEligible = false;
        if (job.eligibility.location && location?.toLowerCase() !== job.eligibility.location.toLowerCase()) isEligible = false;
        if (job.eligibility.gender && job.eligibility.gender !== 'Any' && gender?.toLowerCase() !== job.eligibility.gender.toLowerCase()) isEligible = false;
        
        if (!isEligible) {
          return res.status(400).json({ message: "You do not meet the eligibility criteria for this job." });
        }
      }

      let resumeText = "";
      let resumePath = "";
      
      const resumeFile = req.files['resume'] ? req.files['resume'][0] : null;
      if (resumeFile) {
        resumePath = resumeFile.path;
        try {
          const { data: { text } } = await tesseract.recognize(resumePath, 'eng');
          resumeText = text;
        } catch(ocrErr) {
          console.error("OCR Error:", ocrErr);
          resumeText = req.body.resumeTextFallback || ""; // fallback if OCR fails
        }
      }

      // SBERT SCORING
      let skillScore = 0;
      let integrityScore = 0;
      let certificateBonus = 0;

      // 1. Skill Similarity
      const recruiterSkillsText = job.skillCriteria ? job.skillCriteria.map(sc => sc.skill).join(", ") : "";
      if (recruiterSkillsText && resumeText) {
         try {
           const sbertRes = await axios.post("http://127.0.0.1:5000/match", {
             resumeText: resumeText,
             jobDescription: recruiterSkillsText
           });
           // Normalized SBERT score (0 to 100)
           const sim = Math.max(0, sbertRes.data.score); 
           // Weighted skill score
           const totalSkillWeight = job.skillCriteria.reduce((sum, s) => sum + s.weight, 0);
           skillScore = (sim / 100) * totalSkillWeight;
         } catch(e) {
           console.error("SBERT Error:", e.message);
         }
      }

      // 2. Integrity Questions Similarity
      if (job.integrityCheck && job.integrityCheck.enabled && integrityAnswers) {
         const questionsText = job.integrityCheck.questions.join(" ");
         try {
           const sbertRes = await axios.post("http://127.0.0.1:5000/match", {
             resumeText: integrityAnswers,
             jobDescription: questionsText
           });
           const sim = Math.max(0, sbertRes.data.score);
           integrityScore = (sim / 100) * job.integrityCheck.weight;
         } catch(e) {
           console.error("SBERT Integrity Error:", e.message);
         }
      }

      // 3. Certificate Bonus
      const certificateFile = req.files['certificate'] ? req.files['certificate'][0] : null;
      if (certificateFile) {
         certificateBonus = 10; // fixed 10 points bonus per instruction
      }

      const matchScore = skillScore + integrityScore + certificateBonus;

      // Generate ZKP proof hash
      const proofData = JSON.stringify({ email, jobId, matchScore, timestamp: Date.now() });
      const zkpProofHash = crypto.createHash("sha256").update(proofData).digest("hex");

      const application = new Application({
        jobId,
        candidateId: candidateId && candidateId !== "null" ? candidateId : undefined,
        name,
        email,
        phone,
        age: age ? parseInt(age) : undefined,
        resumePath,
        matchScore,
        scoreDetails: { skillScore, integrityScore, certificateBonus },
        zkpProofHash
      });

      await application.save();

      res.json({
        message: "Application submitted successfully",
        applicationId: application._id
      });

    } catch (err) {
      console.error("APPLICATION ERROR:", err);
      res.status(500).json({ message: "Application failed" });
    }
  }
);

router.get("/myApplications/:email", async (req, res) => {
  try {
    const email = req.params.email;
    if (!email || email === "null") {
      return res.status(400).json({ message: "Invalid email" });
    }

    const apps = await Application.find({ email }).populate("jobId");
    const sanitized = apps.map(app => ({
      _id: app._id,
      jobId: app.jobId,
      appliedAt: app.appliedAt,
    }));
    res.json(sanitized);

  } catch (err) {
    console.log("APPLICATION FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

router.delete("/application/:id", async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (application.resumePath) {
      try { fs.unlinkSync(application.resumePath); } catch (e) {}
    }
    res.json({ message: "Application cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel application" });
  }
});

module.exports = router;