const Application = require("../models/Application");
const {extractText} = require("../services/ocrService");
const {getScore} = require("../services/mlService");

exports.applyJob = async(req,res)=>{

try{

const file = req.file.path;

const text = await extractText(file);

const score = await getScore({resume:text});

const app = new Application({

jobId:req.body.jobId,
candidateId:req.user.id,
resumePath:file,
score

});

await app.save();

res.json(app);

}catch(err){

res.status(500).json(err);

}

};