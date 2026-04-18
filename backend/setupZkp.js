const { initialize } = require("zokrates-js");
const fs = require("fs");
const path = require("path");

const ZKP_DIR = path.join(__dirname, "zkp");
const FRONTEND_PUBLIC_ZKP = path.join(__dirname, "../frontend/public/zkp");

async function setupZkp() {
  console.log("Initializing ZoKrates WebAssembly provider...");
  const zokratesProvider = await initialize();

  // 1. Read circuit
  const source = fs.readFileSync(path.join(ZKP_DIR, "eligibility.zok"), "utf-8");

  // 2. Compile
  console.log("Compiling circuit...");
  const artifacts = zokratesProvider.compile(source);

  // Save compiled program and ABI
  fs.writeFileSync(path.join(ZKP_DIR, "out"), artifacts.program);
  fs.writeFileSync(path.join(ZKP_DIR, "abi.json"), JSON.stringify(artifacts.abi, null, 2));

  // 3. Trusted Setup
  console.log("Running Trusted Setup to generate keys...");
  const keypair = zokratesProvider.setup(artifacts.program);

  // Save keys
  fs.writeFileSync(path.join(ZKP_DIR, "proving.key"), keypair.pk);
  fs.writeFileSync(path.join(ZKP_DIR, "verification.key"), JSON.stringify(keypair.vk, null, 2));

  console.log("ZK Keys generated successfully!");

  // 4. Move required files to Frontend public directory
  console.log("Copying files to frontend public for browser download...");
  if (!fs.existsSync(FRONTEND_PUBLIC_ZKP)) {
    fs.mkdirSync(FRONTEND_PUBLIC_ZKP, { recursive: true });
  }

  // The frontend needs `out` (program), `abi.json`, and `proving.key` to generate proofs locally
  fs.copyFileSync(path.join(ZKP_DIR, "out"), path.join(FRONTEND_PUBLIC_ZKP, "out"));
  fs.copyFileSync(path.join(ZKP_DIR, "abi.json"), path.join(FRONTEND_PUBLIC_ZKP, "abi.json"));
  fs.copyFileSync(path.join(ZKP_DIR, "proving.key"), path.join(FRONTEND_PUBLIC_ZKP, "proving.key"));

  console.log(`Successfully copied artifacts to ${FRONTEND_PUBLIC_ZKP}`);
}

setupZkp().catch(console.error);
