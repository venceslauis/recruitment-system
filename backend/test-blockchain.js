const { certificateChain } = require("./blockchain/blockchain.js");

async function test() {
    console.log("--- Starting Blockchain Transaction Test ---");
    try {
        const testHash = "0x" + require("crypto").randomBytes(32).toString("hex");
        console.log("Using Test Hash:", testHash);
        
        const result = await certificateChain.addBlock({
            certificateHash: testHash,
            candidateId: "TEST_RUNNER",
            fileName: "test-cert.pdf"
        });
        
        console.log("SUCCESS!", result);
    } catch (err) {
        console.error("--- TEST FAILED ---");
        console.error(err);
    }
}

test();
