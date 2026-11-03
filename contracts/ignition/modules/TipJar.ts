import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys TipJar and the TipToken test token, both owned by the deployer.
 *
 * Local only by default:
 *   npx hardhat node
 *   npx hardhat ignition deploy ignition/modules/TipJar.ts --network localhost
 */
export default buildModule("TipJarModule", (m) => {
  const owner = m.getAccount(0);

  const tipJar = m.contract("TipJar", [owner]);
  const tipToken = m.contract("TipToken", [owner]);

  return { tipJar, tipToken };
});
