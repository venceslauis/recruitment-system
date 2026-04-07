const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const { extractText, extractResumeFeatures, extractCertificateFeatures } = require("../services/ocrService");

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
    let jobs = await Job.find().sort({ createdAt: -1 });
    // Mask weightage for candidate
    const maskedJobs = jobs.map(j => {
      const jobObj = j.toObject();
      if (jobObj.skillCriteria) {
        jobObj.skillCriteria = jobObj.skillCriteria.map(sc => ({ skill: sc.skill })); 
      }
      return jobObj;
    });
    res.json(maskedJobs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

router.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No resume provided" });
    const text = await extractText(req.file.path);
    const features = extractResumeFeatures(text);
    // Don't delete file if we want to keep it, but since it's just for parsing...
    // Actually, we can keep it and candidate uploads it again on apply, or just clear it.
    // We will clean it up to save space.
    try { fs.unlinkSync(req.file.path); } catch(e){}
    res.json({ text, ...features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Parsing failed" });
  }
});

router.post("/parse-certificate", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No certificate provided" });
    const text = await extractText(req.file.path);
    const features = extractCertificateFeatures(text);
    try { fs.unlinkSync(req.file.path); } catch(e){}
    res.json({ text, ...features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Parsing failed" });
  }
});

router.post(
  "/apply",
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "certificate", maxCount: 10 }]),
  async (req, res) => {
    try {
      const { 
        jobId, candidateId, name, email, phone, age, 
        experience, cgpa, degree, location, gender, 
        integrityAnswers, projects, internships
      } = req.body;

      // certificateNames and certificateTitles might be arrays if multiple
      let certNames = req.body.certificateNames || [];
      let certTitles = req.body.certificateTitles || [];
      if (!Array.isArray(certNames)) certNames = [certNames];
      if (!Array.isArray(certTitles)) certTitles = [certTitles];

      if (!jobId) return res.status(400).json({ message: "jobId is required" });

      const existingApp = await Application.findOne({ jobId, email });
      if (existingApp) return res.status(400).json({ message: "You have already applied for this job" });

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });

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
          resumeText = await extractText(resumePath);
        } catch(ocrErr) {
          console.error("OCR Error:", ocrErr);
          resumeText = req.body.resumeTextFallback || "";
        }
      }

      // SBERT SCORING
      let skillScore = 0;
      let integrityScore = 0;
      let certificateBonus = 0;

      // 1. Skill Similarity
      const recruiterSkillsText = job.skillCriteria ? job.skillCriteria.map(sc => sc.skill).join(", ") : "";
      // Append projects and internships to resumeText to give it more context for semantic match
      const fullCandidateText = resumeText + " " + (projects || "") + " " + (internships || "");
      if (recruiterSkillsText && fullCandidateText) {
         try {
           const sbertRes = await axios.post("http://127.0.0.1:5000/match", {
             resumeText: fullCandidateText,
             jobDescription: recruiterSkillsText
           });
           const sim = Math.max(0, sbertRes.data.score); 
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
      // Max certs = required by recruiter. Max weight = certificateWeight.
      const maxCerts = job.expectedCertificates || 0;
      const totalCertWeight = job.certificateWeight || 0;
      const weightPerCert = maxCerts > 0 ? (totalCertWeight / maxCerts) : 0;
      
      const certificateFiles = req.files['certificate'] || [];
      const certificatesData = [];
      
      let k = 0; // accumulated cert weight

      for (let i = 0; i < certificateFiles.length; i++) {
         const certName = certNames[i] || "";
         const certTitle = certTitles[i] || "";
         
         let verified = false;
         let score = 0;

         // Check 1: Name match
         const nameMatched = certName.trim().toLowerCase() === name.trim().toLowerCase();
         
         // Check 2: Semantic Similarity >= 0.5
         let semMatchScore = 0;
         if (nameMatched && certTitle) {
            try {
               const sbertRes = await axios.post("http://127.0.0.1:5000/match", {
                  resumeText: certTitle,
                  jobDescription: job.title
               });
               semMatchScore = sbertRes.data.score / 100; // normalize 0-1
            } catch(e) {
               console.error("SBERT Cert Error:", e.message);
            }
         }

         if (nameMatched && semMatchScore >= 0.5) {
             verified = true;
         }

         if (verified && k < totalCertWeight) {
             k += weightPerCert;
             // Ensure we don't exceed totalCertWeight slightly due to floating point
             if (k > totalCertWeight) k = totalCertWeight;
             score = weightPerCert;
         }

         certificatesData.push({
             name: certName,
             title: certTitle,
             verified: verified,
             score: score
         });
      }

      certificateBonus = Math.min(k, totalCertWeight);

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
        projects: projects ? projects.split('\n') : [],
        internships: internships ? internships.split('\n') : [],
        certificates: certificatesData,
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

router.get("/myApplications/:candidateId", async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    if (!candidateId || candidateId === "null") {
      return res.status(400).json({ message: "Invalid candidate details" });
    }

    const apps = await Application.find({ candidateId }).populate("jobId");
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