const { ethers } = require("ethers");
require("dotenv").config();

/**
 * @notice Blockchain Service
 * Connects to the Ethereum Sepolia smart contract to verify and register certificates.
 * 
 * This file replaces the simulated blockchain and provides the same interface
 * to ensure smoothness in the existing workflow.
 */

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const ABI = [
  "function registerCertificate(bytes32 certHash, string candidateId) external",
  "function isCertificateVerified(bytes32 certHash) external view returns (bool)",
  "function getCertificateInfo(bytes32 certHash) external view returns (bool verified, string memory candidateId, uint256 timestamp)",
  "function totalCertificates() external view returns (uint256)",
  "event CertificateRegistered(bytes32 indexed certHash, string candidateId, uint256 timestamp)"
];

let provider;
let wallet;
let contract;

try {
  provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  wallet = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  console.log("✅ Blockchain Service Connected [Sepolia]");
} catch (error) {
  console.error("❌ Blockchain Connection Error:", error.message);
}

/**
 * certificateChain emulation for the existing certificateRoutes.js
 */
const certificateChain = {
  /**
   * findCertificate - Checks if a hash exists on the actual blockchain
   * @param {string} fileHash - Hex string of SHA-256 hash
   */
  async findCertificate(fileHash) {
    try {
      // Convert hex hash to bytes32 if it's not already
      const bytes32Hash = fileHash.startsWith("0x") ? fileHash : "0x" + fileHash;
      const isVerified = await contract.isCertificateVerified(bytes32Hash);
      
      if (!isVerified) return null;

      // Fetch metadata from chain
      const info = await contract.getCertificateInfo(bytes32Hash);
      return {
        hash: bytes32Hash,
        candidateId: info.candidateId,
        timestamp: Number(info.timestamp),
        index: "ON-CHAIN" // Use a string to signify on-chain storage
      };
    } catch (error) {
      console.error("Blockchain Error (findCertificate):", error.message);
      return null;
    }
  },

  /**
   * addBlock - Registers a new certificate on the Sepolia testnet
   * @param {Object} data - Contains certificateHash, candidateId, fileName
   */
  async addBlock(data) {
    try {
      const { certificateHash, candidateId } = data;
      const bytes32Hash = certificateHash.startsWith("0x") ? certificateHash : "0x" + certificateHash;

      console.log(`🚀 Registering certificate hash on-chain: ${bytes32Hash}`);
      
      // Submit transaction
      const tx = await contract.registerCertificate(bytes32Hash, candidateId.toString());
      console.log(`⏳ Waiting for block confirmation... TX: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Certificate mined in block: ${receipt.blockNumber}`);

      return {
        hash: tx.hash,
        index: receipt.blockNumber,
        previousHash: receipt.blockHash,
        nonce: "EVM-TX"
      };
    } catch (error) {
      console.error("Blockchain Error (addBlock):", error.message);
      throw error;
    }
  },

  /**
   * isChainValid - Always true for Ethereum Mainnet/Testnet
   */
  async isChainValid() {
    return true;
  },

  /**
   * getChain - Not practical for a public blockchain, but we can return stats
   */
  async getChain() {
    const count = await contract.totalCertificates();
    return [{ info: "Public Sepolia Blockchain", totalRecords: Number(count) }];
  }
};

module.exports = { certificateChain };
