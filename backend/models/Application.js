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

  name: String,
  email: String,
  phone: String,
  age: Number,

  // Skills extracted from uploaded resume
  resumeSkills: [String],
  projects: [String],
  internships: [String],

  // Processed certificates
  certificates: [{
    name: String,
    title: String,
    score: Number,
    verified: Boolean
  }],

  // Path to the uploaded resume file
  resumePath: String,

  // Weighted match score calculated against job's skill criteria
  matchScore: { type: Number, default: 0 },

  // Score breakdown
  scoreDetails: {
    skillScore: { type: Number, default: 0 },
    integrityScore: { type: Number, default: 0 },
    certificateBonus: { type: Number, default: 0 }
  },

  // ZKP proof hash for the score verification
  zkpProofHash: String,

  appliedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Application", ApplicationSchema);