const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({

name:String,
age:Number,

skills:[String],
score:Number,

resumePath:String

});

module.exports = mongoose.model("Candidate",CandidateSchema);