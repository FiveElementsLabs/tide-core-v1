import { ethers } from "hardhat";

import { WaveContract, WaveFactory } from "../typechain-types/contracts/claim-with-permit";

async function main() {
  console.log("Deploying the factory and a test campaign together...");
  const signer = (await ethers.getSigners())[0];

  const WaveFactoryFactory = await ethers.getContractFactory(
    "contracts/claim-with-permit/WaveFactory.sol:WaveFactory",
    signer
  );

  // Factory into
  const keeper = "0x607291c9b3b03d8c2dc1f5f7f8db2b6a06c91183";
  const trustedForwarderOptimism = "0x61ea47C9f2D33Eb8283e48776794f30A52c92A0B";
  const verifier = "0x75d14f0ae59003c0806b625b402a40340ffde634";

  // Wave info
  const name = "Test Campaign";
  const symbol = "TEST";
  const baseURI = "test";
  const beginTimestamp = 1561534220;
  const endTimestamp = 2771936220;

  const WaveFactoryTx = await WaveFactoryFactory.deploy(keeper, trustedForwarderOptimism, verifier);
  const factoryAddress = await WaveFactoryTx.deployed().then((x) => x.address);
  console.log("factory deployed at: ", factoryAddress);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const WaveFactory = (await ethers.getContractAt(
    "contracts/claim-with-permit/WaveFactory.sol:WaveFactory",
    factoryAddress,
    signer
  )) as WaveFactory;

  const deployWaveTx = await WaveFactory.deployWave(
    name,
    symbol,
    baseURI,
    beginTimestamp,
    endTimestamp
  );
  await deployWaveTx.wait();
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("Wave deployed at: ", await WaveFactory.waves(0));
}

main();
