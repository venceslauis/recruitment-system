const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Application = require("../models/Application");

router.post("/postJob", async (req,res)=>{

try{

const { title, company, description, skills } = req.body;

const job = new Job({

title,
company,
description,
skills,
recruiterId:"demoRecruiter"

});

await job.save();

res.json({
message:"Job posted successfully"
});

}catch(err){

console.log(err);

res.status(500).json({
error:"Failed to post job"
});

}

});
router.get("/myJobs/:recruiterId", async(req,res)=>{

const jobs = await Job.find({
recruiterId:req.params.recruiterId
});

res.json(jobs);

});
router.get("/applicants/:jobId", async (req,res)=>{

try{

const apps = await Application.find({
jobId:req.params.jobId
})
.populate("candidateId")
.sort({score:-1});

res.json(apps);

}catch(err){

console.log(err);

res.status(500).json({
error:"Failed to fetch applicants"
});

}

});
router.get("/allJobs", async (req, res) => {

const Job = require("../models/Job");

const jobs = await Job.find();

res.json(jobs);

});

module.exports = router;