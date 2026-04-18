const fs = require('fs');
const path = require('path');
const { initialize } = require('zokrates-js');

(async () => {
    try {
        console.log("Loading ZK...");
        const zokratesProvider = await initialize();
        const vkPath = path.join(__dirname, "zkp/verification.key");
        const verificationKey = JSON.parse(fs.readFileSync(vkPath, "utf-8"));
        console.log("Keys loaded.");

        // Dummy proof object
        const zkpProof = {
            proof: { a: ["0x0", "0x0"], b: [["0x0", "0x0"], ["0x0", "0x0"]], c: ["0x0", "0x0"] },
            inputs: ["0x0000000000000000000000000000000000000000000000000000000000000000"]
        };

        const isProofValid = zokratesProvider.verify(verificationKey, zkpProof);
        console.log("Valid? " + isProofValid);
    } catch(e) {
        console.error("Crash:", e);
    }
})();
