const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Application = require("../models/Application");

/* =========================
   POST JOB (with skill criteria & weightage)
========================= */

router.post("/postJob", async (req, res) => {

  try {

    const { title, company, description, skills, skillCriteria, recruiterId } = req.body;

    const job = new Job({
      title,
      company,
      description,
      skills,
      skillCriteria,       // [{ skill: "react", weight: 30 }, { skill: "node", weight: 25 }, ...]
      recruiterId: recruiterId || "demoRecruiter"
    });

    await job.save();

    res.json({
      message: "Job posted successfully"
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

  const jobs = await Job.find({
    recruiterId: req.params.recruiterId
  });

  res.json(jobs);

});

/* =========================
   GET APPLICANT RANKINGS
   Privacy: returns ONLY rank, matchScore,
   and matched skill categories.
   NO candidate personal details (name, age).
========================= */

router.get("/applicants/:jobId", async (req, res) => {

  try {

    const apps = await Application.find({
      jobId: req.params.jobId
    })
      .populate("jobId")
      .sort({ matchScore: -1 });

    // Build anonymized ranking — no candidate personal info
    const rankings = apps.map((app, index) => ({
      _id: app._id,
      rank: index + 1,
      matchScore: app.matchScore,
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

  const jobs = await Job.find();
  res.json(jobs);

});

module.exports = router;