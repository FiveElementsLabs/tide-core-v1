import { ethers } from "hardhat";

async function main() {
  console.log("Deploying forwarder...");
  const signer = (await ethers.getSigners())[0];

  const ForwarderFactory = await ethers.getContractFactory(
    "MinimalForwarder",
    signer
  );

  const ForwarderTx = await ForwarderFactory.deploy();
  const forwarderAddress = await ForwarderTx.deployed().then((x) => x.address);

  console.log("Forwarder deployed at: ", forwarderAddress);
}

main();
