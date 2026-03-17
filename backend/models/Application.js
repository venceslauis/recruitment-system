const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },

  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate"
  },

  // Candidate details (submitted at application time, kept private from recruiters)
  name: String,
  age: Number,

  // Skills extracted from uploaded resume
  resumeSkills: [String],

  // Path to the uploaded resume file
  resumePath: String,

  // Weighted match score calculated against job's skill criteria (visible only to recruiter as anonymous rank)
  matchScore: { type: Number, default: 0 },

  // ZKP proof hash for the score verification
  zkpProofHash: String,

  appliedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Application", ApplicationSchema);