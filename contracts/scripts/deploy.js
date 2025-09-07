const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy TipToken first
  console.log("Deploying TipToken...");
  const TipToken = await hre.ethers.getContractFactory("TipToken");
  const tipToken = await TipToken.deploy();
  await tipToken.waitForDeployment();
  const tipTokenAddress = await tipToken.getAddress();
  console.log("TipToken deployed to:", tipTokenAddress);

  // Deploy TipJar
  console.log("Deploying TipJar...");
  const TipJar = await hre.ethers.getContractFactory("TipJar");
  const tipJar = await TipJar.deploy();
  await tipJar.waitForDeployment();
  const tipJarAddress = await tipJar.getAddress();
  console.log("TipJar deployed to:", tipJarAddress);

  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Log contract addresses for frontend
  console.log("\n=== Contract Addresses ===");
  console.log("TipJar:", tipJarAddress);
  console.log("TipToken:", tipTokenAddress);
  console.log("Deployer:", deployer.address);

  // Save addresses to a file for frontend use
  const fs = require('fs');
  const contractAddresses = {
    TipJar: tipJarAddress,
    TipToken: tipTokenAddress,
    Deployer: deployer.address,
    Network: hre.network.name
  };
  
  fs.writeFileSync(
    '../frontend/contract-addresses.json', 
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("\nContract addresses saved to frontend/contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
