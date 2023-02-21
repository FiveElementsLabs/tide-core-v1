import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  WaveContract,
  WaveFactory,
} from "../../typechain-types/contracts/core";

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
      "contracts/core/WaveFactory.sol:WaveFactory"
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
      blockTimestamp + 60 * 60 * 24 * 90,
      true
    );
    await createTx.wait();

    campaign = (await ethers.getContractAt(
      "contracts/core/WaveContract.sol:WaveContract",
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

  it("should not be transferable if soulbound", async function () {
    await expect(
      campaign.connect(user).transferFrom(user.address, keeper.address, 1)
    ).to.be.reverted;
  });

  it("should be transferrable if passed in the constructor", async function () {
    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    const tx = await factory.deployWave(
      "Wave",
      "WAVE",
      "https://wave.com/",
      blockTimestamp - 1000,
      blockTimestamp + 60 * 60 * 24 * 9,
      false
    );
    await tx.wait();
    const transferrableCampaign = (await ethers.getContractAt(
      "contracts/core/WaveContract.sol:WaveContract",
      await factory.waves(1)
    )) as WaveContract;

    const spender = user.address;
    const rewardId = 116;
    const deadline = blockTimestamp + 6000;

    const digest = await transferrableCampaign.getTypedDataHash({
      spender,
      rewardId,
      deadline,
    });

    const signatureString = await verifier.signMessage(
      ethers.utils.arrayify(digest)
    );
    const { v, r, s } = ethers.utils.splitSignature(signatureString);

    const claimTx = await transferrableCampaign
      .connect(user)
      .claim(rewardId, deadline, v, r, s);
    await claimTx.wait();

    const transferTx = await transferrableCampaign
      .connect(user)
      .transferFrom(user.address, keeper.address, 1);
    await transferTx.wait();

    const balance = await transferrableCampaign.balanceOf(keeper.address);
    expect(balance).to.equal(1);
  });
});
