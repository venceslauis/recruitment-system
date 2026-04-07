const mongoose = require("mongoose");

const SkillCriteriaSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  weight: { type: Number, required: true } 
}, { _id: false });

const JobSchema = new mongoose.Schema({

  title: String,
  company: String,
  description: String,

  // ZKP-based eligibility criteria (Candidate must match these to apply)
  eligibility: {
    experience: Number, // Minimum years
    cgpa: Number,       // Minimum CGPA
    degree: String,     // Required degree (e.g., 'B.Tech')
    location: String,   // Preferred location
    income: Number,     // Max expected income maybe? Or just a filter
    gender: String,     // e.g., 'Any', 'Male', 'Female'
    backlogs: Number,   // Maximum allowed backlogs
    yearOfPassing: Number, // e.g. 2024
    age: Number         // Maximum age
  },

  // SBERT Semantic match criteria: skill + weight
  skillCriteria: [SkillCriteriaSchema],

  // Certificates criteria
  certificateWeight: { type: Number, default: 0 },
  expectedCertificates: { type: Number, default: 0 },

  // AI Integrity questions
  integrityCheck: {
    enabled: { type: Boolean, default: false },
    questions: [String],
    weight: { type: Number, default: 0 }
  },

  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Job", JobSchema);