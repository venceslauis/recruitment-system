const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/job_portal")
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

module.exports = mongoose;