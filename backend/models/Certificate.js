const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({

  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  filePath: String,

  /* SHA-256 hash of the uploaded file */
  fileHash: {
    type: String,
    required: true
  },

  /* Hash of the block on the chain */
  blockHash: String,

  blockIndex: Number,

  verified: {
    type: Boolean,
    default: false
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Certificate", CertificateSchema);
