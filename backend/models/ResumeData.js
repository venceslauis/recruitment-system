const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

applicationId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Application"
},

skills:[String],

experience:Number,

education:String,

score:Number

});

module.exports = mongoose.model("ResumeData",resumeSchema);