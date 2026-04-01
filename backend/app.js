const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/recruiter",recruiterRoutes);
app.use("/api/candidate",candidateRoutes);
app.use("/api/certificate",certificateRoutes);

app.get("/",(req,res)=>{
res.send("API WORKING");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT,()=>{
console.log(`Server running on port ${PORT}`);
});