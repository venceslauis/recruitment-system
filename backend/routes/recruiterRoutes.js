const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Application = require("../models/Application");

/* =========================
   POST JOB
========================= */

router.post("/postJob", async (req, res) => {

  try {

    const { title, company, description, eligibility, skillCriteria, integrityCheck, certificateWeight, expectedCertificates, recruiterId } = req.body;

    // Validate weights total to 100 or 1.0 depending on scale used. Assume scale is 100 here.
    let totalWeight = 0;
    if (skillCriteria && skillCriteria.length > 0) {
      totalWeight += skillCriteria.reduce((sum, s) => sum + s.weight, 0);
    }
    if (integrityCheck && integrityCheck.enabled) {
      totalWeight += integrityCheck.weight || 0;
    }
    if (certificateWeight) {
      totalWeight += certificateWeight;
    }

    if (totalWeight !== 100 && totalWeight !== 1) {
       return res.status(400).json({ error: "Total weightage (skills + integrity + certificates) must equal 100 or 1.0" });
    }

    const job = new Job({
      title,
      company,
      description,
      eligibility,
      skillCriteria,
      certificateWeight,
      expectedCertificates,
      integrityCheck,
      recruiterId
    });

    await job.save();

    res.json({
      message: "Job posted successfully",
      job
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to post job"
    });

  }

});

/* =========================
   GET MY JOBS
========================= */

router.get("/myJobs/:recruiterId", async (req, res) => {

  try {
    const jobs = await Job.find({
      recruiterId: req.params.recruiterId
    });

    res.json(jobs);
  } catch(err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }

});

/* =========================
   GET APPLICANT RANKINGS
========================= */

router.get("/applicants/:jobId", async (req, res) => {

  try {

    const apps = await Application.find({
      jobId: req.params.jobId
    })
      .populate("jobId")
      .sort({ matchScore: -1 });

    const rankings = apps.map((app, index) => ({
      _id: app._id,
      rank: index + 1,
      name: app.name,
      email: app.email,
      phone: app.phone,
      matchScore: app.matchScore,
      scoreDetails: app.scoreDetails,
      resumeSkills: app.resumeSkills,
      zkpProofHash: app.zkpProofHash,
      appliedAt: app.appliedAt
    }));

    res.json(rankings);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to fetch applicants"
    });

  }

});

/* =========================
   GET ALL JOBS
========================= */

router.get("/allJobs", async (req, res) => {

  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch(err) {
    res.status(500).json({ error: "Failed to fetch all jobs" });
  }

});

module.exports = router;