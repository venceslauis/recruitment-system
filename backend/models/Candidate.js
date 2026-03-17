const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({

name:String,
age:Number,

skills:[String],
score:Number,

certificateBonus:{
type:Number,
default:0
},

resumePath:String

});

module.exports = mongoose.model("Candidate",CandidateSchema);