const mongoose = require("mongoose");

const SkillCriteriaSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  weight: { type: Number, required: true }   // percentage weight (all weights for a job should sum to 100)
}, { _id: false });

const JobSchema = new mongoose.Schema({

  title: String,
  company: String,
  description: String,
  skills: [String],

  // ZKP-based eligibility criteria: each skill has a weight for scoring
  skillCriteria: [SkillCriteriaSchema],

  recruiterId: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Job", JobSchema);