const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({

jobId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Job"
},

candidateId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Candidate"
},

score:Number

});

module.exports = mongoose.model("Application",ApplicationSchema);