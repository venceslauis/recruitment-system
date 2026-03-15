const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({

title:String,
description:String,
skills:[String],

recruiterId:String,

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Job",JobSchema);