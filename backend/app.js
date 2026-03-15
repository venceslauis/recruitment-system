const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/recruiter",recruiterRoutes);
app.use("/api/candidate",candidateRoutes);

app.get("/",(req,res)=>{
res.send("API WORKING");
});

app.listen(5000,()=>{
console.log("Server running on port 5000");
});