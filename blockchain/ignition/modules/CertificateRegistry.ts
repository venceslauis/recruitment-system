import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition deployment module for CertificateRegistry.
 *
 * Deploy to Sepolia:
 *   npx hardhat ignition deploy ignition/modules/CertificateRegistry.ts --network sepolia
 */
export default buildModule("CertificateRegistryModule", (m) => {
  const registry = m.contract("CertificateRegistry");
  return { registry };
});
