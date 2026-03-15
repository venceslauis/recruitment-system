const Job = require("../models/Job");

exports.postJob = async(req,res)=>{

try{

const job = new Job(req.body);

await job.save();

res.json(job);

}catch(err){
res.status(500).json(err);
}

};


exports.getJobs = async(req,res)=>{

const jobs = await Job.find();

res.json(jobs);

};