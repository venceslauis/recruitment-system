const express = require("express");
const router = express.Router();

const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const calculateMatchScore = require("../utils/matchScore");
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
"kubernetes"
];

/* =========================
   SKILL EXTRACTION
========================= */

function extractSkills(text){

const lowerText = text.toLowerCase();
const detected = [];

skillsDB.forEach(skill=>{
if(lowerText.includes(skill)){
detected.push(skill);
}
});

return detected;

}

/* =========================
   SCORE CALCULATION
========================= */

function calculateScore(skills){

let score = skills.length * 10;

if(score > 100){
score = 100;
}

return score;

}

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
destination: function (req,file,cb){
cb(null,"uploads/");
},
filename: function (req,file,cb){
cb(null,Date.now()+"-"+file.originalname);
}
});

const upload = multer({ storage });

/* =========================
   GET ALL JOBS
========================= */

router.get("/jobs", async (req,res)=>{

try{

const jobs = await Job.find();
res.json(jobs);

}catch(err){

console.log(err);
res.status(500).json({message:"Failed to fetch jobs"});

}

});

/* =========================
   APPLY FOR JOB
========================= */

router.post("/apply", async (req,res)=>{
await axios.post(
"http://localhost:5000/api/candidate/apply",
{
jobId,
candidateId: localStorage.getItem("candidateId")
}
);
try{

const { jobId, candidateId } = req.body;

const application = new Application({
jobId,
candidateId
});

await application.save();

res.json({message:"Application submitted"});

}catch(err){

console.log(err);
res.status(500).json({message:"Application failed"});

}

});

/* =========================
   UPLOAD RESUME
========================= */

router.post(
"/uploadResume",
upload.single("resume"),
async (req,res)=>{

try{

if(!req.file){
return res.status(400).json({error:"No file uploaded"});
}

const dataBuffer = fs.readFileSync(req.file.path);

const pdfData = await pdfParse(dataBuffer);

const text = pdfData.text;

const skills = extractSkills(text);
const score = calculateScore(skills);

/* Save candidate */

const candidate = await Candidate.create({

name:req.body.name || "",
age:req.body.age || 0,

skills,
score,
resumePath:req.file.path

});

res.json({
candidateId:candidate._id,
skills,
score
});

}catch(err){

console.error(err);
res.status(500).json({error:"Resume parsing failed"});

}

}
);
router.post("/saveProfile", async (req,res)=>{

try{

const { name, age, skills, score } = req.body;

const candidate = await Candidate.create({

name,
age,
skills,
score

});

res.json({
message:"Profile saved",
candidateId:candidate._id
});

}catch(err){

console.log(err);

res.status(500).json({
error:"Failed to save profile"
});

}

});
router.get("/profile/:id", async (req,res)=>{

try{

const candidate = await Candidate.findById(req.params.id);

if(!candidate){
return res.status(404).json({
message:"Candidate not found"
});
}

res.json(candidate);

}catch(err){

console.log(err);

res.status(500).json({
error:"Failed to fetch profile"
});

}

});
/* =========================
   GET MY APPLICATIONS
========================= */

router.get("/myApplications/:candidateId", async (req,res)=>{

try{

const candidateId = req.params.candidateId;

if(!candidateId || candidateId === "null"){
return res.status(400).json({message:"Invalid candidateId"});
}

const apps = await Application.find({ candidateId })
.populate("jobId");

res.json(apps);

}catch(err){

console.log("APPLICATION FETCH ERROR:",err);
res.status(500).json({message:"Failed to fetch applications"});

}

});
module.exports = router;