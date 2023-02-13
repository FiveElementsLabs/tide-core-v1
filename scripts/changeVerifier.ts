import { ethers } from "hardhat";

import { WaveFactory } from "../typechain-types/contracts/claim-with-permit/WaveFactory";

async function main() {
  const [verifier] = await ethers.getSigners();

  const factoryAddress = "0x9Af2dEd80720B4985117aeF9c9cb77B0Be058d01";
  const newVerifier = "0x75d14F0Ae59003C0806B625B402a40340Ffde634";

  const factory = (await ethers.getContractAt(
    "contracts/claim-with-permit/WaveFactory.sol:WaveFactory",
    factoryAddress,
    verifier
  )) as WaveFactory;

  const tx = await factory.changeVerifier(newVerifier);
  await tx.wait();

  console.log("Verifier changed to", newVerifier);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
