const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["candidate", "recruiter"], required: true },

  // Links this user account to their Candidate profile document
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null }

});

module.exports = mongoose.model("User", UserSchema);