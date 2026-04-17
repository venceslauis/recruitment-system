const mongoose = require("mongoose");

const RegistrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
    required: true,
    unique: true
  },
  issuerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null
  },
  onChain: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Registry", RegistrySchema);
