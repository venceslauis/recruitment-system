const crypto = require("crypto");

/* ─────────────────────────────────────────────
   Block
───────────────────────────────────────────── */

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;               // { certificateHash, candidateId, fileName }
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
      )
      .digest("hex");
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join("0");
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

/* ─────────────────────────────────────────────
   Blockchain
───────────────────────────────────────────── */

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;       // low difficulty for quick demo mining
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), { message: "Genesis Block" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      data,
      this.getLatestBlock().hash
    );
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  /* Walk the chain and verify integrity */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }

  /* Check whether a specific certificate hash exists on-chain */
  findCertificate(certificateHash) {
    for (const block of this.chain) {
      if (block.data && block.data.certificateHash === certificateHash) {
        return block;
      }
    }
    return null;
  }

  /* Return full chain (for debug / transparency view) */
  getChain() {
    return this.chain;
  }
}

/* ─────────────────────────────────────────────
   Singleton – one blockchain instance for the
   lifetime of the server process
───────────────────────────────────────────── */

const certificateChain = new Blockchain();

module.exports = { Blockchain, certificateChain };
