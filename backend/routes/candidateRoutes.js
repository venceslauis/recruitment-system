const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Registry = require("../models/Registry");
const { extractText, extractResumeFeatures, extractCertificateFeatures, fuzzyNameMatch, scoreIntegrityWithLLM } = require("../services/ocrService");
const { certificateChain } = require("./../blockchain/blockchain.js");

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
    const features = await extractResumeFeatures(text);
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
    const features = await extractCertificateFeatures(text);
    try { fs.unlinkSync(req.file.path); } catch(e){}
    res.json({ text, ...features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Parsing failed" });
  }
});

/* =========================
   CHECK CERTIFICATE ON BLOCKCHAIN
   Called when candidate uploads a cert — before applying.
   Returns { onChain, isOfficial } for the UI badge.
========================= */
router.post("/check-certificate", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    // Hash the file
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Clean up temp file
    try { fs.unlinkSync(req.file.path); } catch(e) {}

    // Check on Sepolia blockchain
    let onChain = false;
    let blockchainError = null;
    try {
      const onChainData = await certificateChain.findCertificate(fileHash);
      onChain = !!onChainData;
    } catch (chainErr) {
      blockchainError = chainErr.message;
      console.error("Blockchain lookup failed:", chainErr.message);
    }

    // Check if it was officially issued (in Registry)
    const isOfficial = await Registry.exists({ fileHash });

    res.json({
      fileHash,
      onChain,
      isOfficial: !!isOfficial,
      // 'error' lets the frontend show "Check Failed" instead of false "Unverified"
      status: blockchainError ? "error" : onChain ? "verified" : "unverified",
      error: blockchainError
    });
  } catch (err) {
    console.error("CERTIFICATE CHECK ERROR:", err.message);
    res.status(500).json({ message: "Blockchain check failed", error: err.message, status: "error" });
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

      // ─── PARALLEL SCORING ────────────────────────────────────────────────────
      // FIX 1: Use Vertex AI-extracted skills field as primary comparison text
      // (focused, clean signal) with resume as fallback context
      const candidateSkillsText = (req.body.skills || "").trim() || resumeText;
      const maxCerts        = job.expectedCertificates || 0;
      const totalCertWeight = job.certificateWeight || 0;
      const weightPerCert   = maxCerts > 0 ? (totalCertWeight / maxCerts) : 0;
      const certificateFiles = req.files['certificate'] || [];

      const sbertCall = (text1, text2) =>
        axios.post("http://127.0.0.1:5000/match", { resumeText: text1, jobDescription: text2 })
             .then(r => Math.max(0, r.data.score))
             .catch(e => { console.error("SBERT Error:", e.message); return 0; });

      // ── 1. Proportional Skill Scoring (per-skill SBERT, all in parallel) ──────
      // FIX 2: Proportional formula — score = (sim / 100) * weight per skill
      // Eliminates cliff-edge of binary threshold for fairer scoring
      const integrityEnabled = job.integrityCheck?.enabled && integrityAnswers;
      const integrityWeight  = job.integrityCheck?.weight || 0;

      const [skillBreakdown, llmIntegrityScore] = await Promise.all([
        Promise.all(
          (job.skillCriteria || []).map(async ({ skill, weight }) => {
            const sim = await sbertCall(candidateSkillsText, skill);
            const contribution = parseFloat(((sim / 100) * weight).toFixed(2)); // proportional
            return {
              skill,
              weight,
              similarity: parseFloat(sim.toFixed(1)),
              contribution,                         // actual points earned for this skill
              matched: sim >= 50                    // display flag only (for UI green/red)
            };
          })
        ),
        integrityEnabled
          ? scoreIntegrityWithLLM(job.integrityCheck.questions, integrityAnswers, integrityWeight)
          : Promise.resolve(0),
      ]);

      // Skill score = sum of proportional contributions across all skills
      const skillScore = parseFloat(
        skillBreakdown.reduce((sum, s) => sum + s.contribution, 0).toFixed(2)
      );

      console.log(`📊 Skill Score: ${skillScore} (proportional)`);
      skillBreakdown.forEach(s => console.log(`   ${s.matched ? '✅' : '⚠️ '} ${s.skill}: sim=${s.similarity}%, contrib=${s.contribution}/${s.weight}`));

      // ── 2. Integrity score ────────────────────────────────────────────────────
      let integrityScore = 0;
      if (llmIntegrityScore !== null) {
        integrityScore = llmIntegrityScore;
      } else if (integrityEnabled) {
        console.warn("LLM integrity failed — falling back to SBERT");
        const sbertSim = await sbertCall(integrityAnswers, job.integrityCheck.questions.join(" "));
        integrityScore = (sbertSim / 100) * integrityWeight;
      }

      // ── 3. Certificates — name check (local), then SBERT vs job title+skills ──
      // FIX 3: Compare cert against job title + required skills for richer context
      const jobContextForCert = job.title + " " + (job.skillCriteria?.map(s => s.skill).join(" ") || "");

      const certSBERTPromises = certificateFiles.map((_, i) => {
        const certName  = certNames[i] || "";
        const certTitle = certTitles[i] || "";
        const nameMatchScore = fuzzyNameMatch(certName, name);
        const nameMatched    = nameMatchScore >= 0.7;
        console.log(`Cert [${i}] name match: "${certName}" vs "${name}" → ${nameMatchScore.toFixed(2)}, matched: ${nameMatched}`);
        if (nameMatched && certTitle) {
          // FIX 3: compare against job title + skills context (not just title)
          return sbertCall(certTitle, jobContextForCert).then(sim => ({ nameMatched, semSim: sim / 100, certName, certTitle }));
        }
        return Promise.resolve({ nameMatched: false, semSim: 0, certName, certTitle });
      });

      const certResults = await Promise.all(certSBERTPromises);
      const certificatesData = [];
      
      // Setup tracking variables as per formula
      let k = 0;                           // Accumulated score
      let verified_count = 0;              // Number of accepted certificates

      for (let i = 0; i < certResults.length; i++) {
        const { nameMatched, semSim, certName, certTitle } = certResults[i];
        const certFile = certificateFiles[i];

        // 1. Calculate SHA-256 hash of the certificate file
        const fileBuffer = fs.readFileSync(certFile.path);
        const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        // 2. Blockchain Check: Is it already verified?
        let onChainData = await certificateChain.findCertificate(fileHash);
        
        // 2.1 Registry Check: Is it an "Official" certificate?
        const isOfficial = await Registry.exists({ fileHash });
        
        // 3. If not on chain, register it now
        if (!onChainData) {
          console.log(`🔗 New certificate detected! Registering on blockchain: ${certTitle}`);
          try {
            await certificateChain.addBlock({
              certificateHash: fileHash,
              candidateId: candidateId || "anonymous",
              fileName: certFile.originalname
            });
            onChainData = { verified: true }; // Minimal mock for the loop
          } catch (chainErr) {
            console.error("Blockchain Registration Error:", chainErr.message);
          }
        } else {
          console.log(`✅ Certificate match found on-chain: ${certTitle}`);
        }

        // 4. Verification Logic
        // Condition (1): Name Matching
        const cond1_nameMatch = nameMatched;
        // Condition (2): Semantic Similarity
        const cond2_semMatch = semSim >= 0.5;
        // Condition (3): Blockchain Verification
        const cond3_blockchain = !!onChainData;

        // Final Validation Check
        const verified = cond1_nameMatch && cond2_semMatch && cond3_blockchain;
        
        let score = 0;
        
        if (verified) {
          // If candidate uploads more than the required no. of verified proof then compute the score 
          // for only the required proof and other certificates are considered but score will not generate.
          if (verified_count < maxCerts) {
            k = k + weightPerCert;
            score = weightPerCert;
            verified_count = verified_count + 1;
          }
        }

        certificatesData.push({ 
          name: certName, 
          title: certTitle, 
          verified, 
          score,
          fileHash,
          onChain: cond3_blockchain,
          isOfficial: !!isOfficial
        });

        console.log(`Cert "${certName}" [${certTitle}] → verified: ${verified} [name:${cond1_nameMatch}, sem:${semSim.toFixed(2)}, chain:${cond3_blockchain}] | score: ${score}`);
      }

      const certificateBonus = Math.min(k, totalCertWeight);

      // Final Score Calculation Model
      // General formula: Score = ∑(Feature_i × Weight_i) + k
      // (1) Semantic Skill Score = ∑(Skill_Sim_i * Weight_i) 
      // (2) Integrity Score = (Integrity_Sim * Weight_i)
      // (3) baseScore sums all the semantic feature values
      const baseScore = skillScore + integrityScore;
      
      // (4) Add 'k' (certificate score) to the base score
      const matchScore = parseFloat((baseScore + certificateBonus).toFixed(2));

      console.log(`🏆 Final matchScore: ${matchScore} (baseScore: ${baseScore.toFixed(2)}, k/certificateScore: ${certificateBonus.toFixed(2)})`);

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
        scoreDetails: { skillScore, integrityScore, certificateBonus, skillBreakdown },
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