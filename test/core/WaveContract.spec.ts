import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { WaveContract, WaveFactory } from "../../typechain-types/contracts/core";

describe("WaveContract.sol", function () {
  let signers: SignerWithAddress[];
  let factory: WaveFactory;
  let user: SignerWithAddress;
  let keeper: SignerWithAddress;
  let verifier: SignerWithAddress;
  let campaign: WaveContract;

  before(async function () {
    signers = await ethers.getSigners();
    verifier = signers[0];
    keeper = signers[1];
    user = signers[2];

    const factoryFactory = await ethers.getContractFactory(
      "contracts/claim-with-permit/WaveFactory.sol:WaveFactory"
    );

    factory = (await factoryFactory.deploy(
      keeper.getAddress(),
      ethers.constants.AddressZero,
      verifier.getAddress()
    )) as WaveFactory;
    await factory.deployed();

    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    const createTx = await factory.deployWave(
      "Wave",
      "WAVE",
      "https://wave.com/",
      blockTimestamp - 1000,
      blockTimestamp + 60 * 60 * 24 * 90
    );
    await createTx.wait();

    campaign = (await ethers.getContractAt(
      "contracts/claim-with-permit/WaveContract.sol:WaveContract",
      await factory.waves(0)
    )) as WaveContract;
  });

  it("should mint a reward with verifier signature", async function () {
    const spender = user.address;
    const rewardId = 116;
    const deadline = 1671698921;

    const digest = await campaign.getTypedDataHash({
      spender,
      rewardId,
      deadline,
    });

    const signatureString = await verifier.signMessage(
      ethers.utils.arrayify(digest)
    );
    const { v, r, s } = ethers.utils.splitSignature(signatureString);

    const tx = await campaign.connect(user).claim(rewardId, deadline, v, r, s);
    await tx.wait();

    const balance = await campaign.balanceOf(user.address);
    expect(balance).to.equal(1);
  });
});
