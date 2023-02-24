import { ethers } from "hardhat";

import { WaveFactory } from "../typechain-types/contracts/core";
import { TIDE_KEEPER, TIDE_VERIFIER, TRUSTED_FORWARDERS } from "./addresses";

async function main() {
  console.log("Deploying the factory and a test campaign together...");
  const signer = (await ethers.getSigners())[0];

  const WaveFactoryFactory = await ethers.getContractFactory(
    "contracts/core/WaveFactory.sol:WaveFactory",
    signer
  );

  // @dev Fill the following data before deploying
  // Factory into
  const chainId = 42161;
  const keeper = TIDE_KEEPER;
  const trustedForwarder = TRUSTED_FORWARDERS[chainId];
  const verifier = TIDE_VERIFIER;

  // Wave info
  const name = "Campaign Name";
  const symbol = "SYM";
  const baseURI = "https://example.com/";
  const beginTimestamp = 1561534220;
  const endTimestamp = 2771936220;

  const WaveFactoryTx = await WaveFactoryFactory.deploy(
    keeper,
    trustedForwarder,
    verifier
  );
  const factoryAddress = await WaveFactoryTx.deployed().then((x) => x.address);
  console.log("factory deployed at: ", factoryAddress);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const WaveFactory = (await ethers.getContractAt(
    "contracts/core/WaveFactory.sol:WaveFactory",
    factoryAddress,
    signer
  )) as WaveFactory;

  const deployWaveTx = await WaveFactory.deployWave(
    name,
    symbol,
    baseURI,
    beginTimestamp,
    endTimestamp,
    false
  );
  await deployWaveTx.wait();
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("Wave deployed at: ", await WaveFactory.waves(0));
}

main();
