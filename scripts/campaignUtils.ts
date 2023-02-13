import { getAddress } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { WaveFactory } from "../typechain-types";

const SECONDS_PER_DAY = 60 * 60 * 24;

async function deployCampaign(
  contractName: string,
  name: string,
  symbol: string,
  root: string,
  baseURI: string,
  beginTimestamp: number,
  endTimestamp: number
) {
  const signers = await ethers.getSigners();

  const campaignFactory = await ethers.getContractFactory(contractName);
  const campaign = await campaignFactory.deploy(
    name,
    symbol,
    baseURI,
    root,
    beginTimestamp,
    endTimestamp,
    "0x8f5B08237d9aaf212a6ABeF3379149765dEE9C10",
    "0xfC1914aa8482927417E1dc0bCD7f728316D40f32",
    { gasLimit: 7000000 }
  );
  const tx = await campaign.deployed();
  console.log("campaign deployed", tx);
  console.log("deployed at address: ", campaign.address);
}

async function retreiveURI(contractName: string, address: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const uri = await campaign.tokenURI(1);
  console.log("uri", uri);
}

async function retrieveTimings(contractName: string, address: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const start = await campaign.startTimestamp();
  const end = await campaign.endTimestamp();
  console.log("start", start.toString());
  console.log("end", end.toString());
  console.log("name", await campaign.name());
}

async function claim(contractName: string, address: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const tx = await campaign.claim([], "early-adopter");
  console.log("claimed token id 1", tx);
}

async function updateRoot(contractName: string, address: string, newRoot: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const tx = await campaign.changeRoot(newRoot, { gasLimit: 500000 });
  console.log("root updated to", newRoot);
  console.log("transaction:", tx);
}

async function updateBaseURI(contractName: string, address: string, newURI: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const tx = await campaign.changeBaseURI(newURI, false);
  console.log("URI updated to", newURI);
  console.log("transaction:", tx);
}

async function fetchRoot(contractName: string, address: string) {
  const campaign = await ethers.getContractAt(contractName, address);
  const root = await campaign.root();
  console.log("root", root);
}

async function deployWaveFactory(keeper: string, relayer: string) {
  const signers = await ethers.getSigners();
  const waveFactoryFactory = await ethers.getContractFactory(
    "contracts/ERC2771-compatible/WaveFactory.sol:WaveFactory"
  );
  const waveFactory = await waveFactoryFactory.deploy(keeper, relayer, { gasLimit: 10000000 });
  const tx = await waveFactory.deployed();
  console.log("wave factory deployed", tx);
  console.log("deployed at address: ", waveFactory.address);
}

async function deployWaveUsingFactory(
  name: string,
  symbol: string,
  root: string,
  baseURI: string,
  beginTimestamp: number,
  endTimestamp: number
) {
  const signers = await ethers.getSigners();

  const waveFactory = (await ethers.getContractAt(
    "WaveFactory",
    campaigns.wave_factory_polygon
  )) as WaveFactory;
  const tx = await waveFactory.deployWave(
    name,
    symbol,
    baseURI,
    root,
    beginTimestamp,
    endTimestamp,
    {
      gasLimit: 3000000,
    }
  );
  console.log("wave deployed", tx);
}

async function retreiveAddress() {
  const signers = await ethers.getSigners();
  const waveFactory = (await ethers.getContractAt(
    "WaveFactory",
    campaigns.wave_factory_polygon
  )) as WaveFactory;
  const address = await waveFactory.waves(0);
  console.log("address", address);
}

async function award(contractAddress: string, tokenIds: number[], reward: string) {
  const signers = await ethers.getSigners();
  const wave = await ethers.getContractAt(
    "contracts/ERC2771-compatible/WaveContract.sol:WaveContract",
    contractAddress
  );
  const tx = await wave.award(tokenIds, reward);
  console.log("awarded", await tx.wait());
}

async function airdrop(contractAddress: string, params: any) {
  const wave = await ethers.getContractAt(
    "contracts/ERC2771-compatible/WaveContract.sol:WaveContract",
    contractAddress
  );
  const tx = await wave.airdrop(params);
  console.log("airdropped", tx);
}

const campaigns = {
  tide_demo_arbitrum: "0x95C5Dc11E6430c9988C416cC3c15018d829cfFF6",
  tide_demo_polygon: "0xe2179281674359dAa3c3998C92855a9cFec79863",
  tide_demo_polygon_2: "0xacE68b08b07E80Aad9ce307dfF0C06d9e94f491c",
  tide_official_campaign: "0x152cc232fF378D98A42da849F7C58d88007D1f1b",
  tide_official_campaign_take_two: "0x53e60dDF0497acf0E3d8360F0E5d8BeeB29E1348",
  tide_final: "0xBE861b7576e8Ea260ACc76b33CCac7358D5236a0",
  nftperp_wave_polygon: "0x40ad7a59A04779AaFcCFCB15edd32e5C085e9F23",
  nftperp_wave_arbitrum: "0x7B5443113bcb5e975B21F6F431aC3314c7382041",
  secret_wave_arbitrum: "0xAb787f5477e95b03f50C5982d36117b2d4a0ac3c",
  nftperp_wave_final: "0x7B5443113bcb5e975B21F6F431aC3314c7382041",
  impact_fantasy_wave: "0x53ec800a0F50165a09E85812b3f5836ae9d1a906",
  wave_factory_polygon: "0xD3a18307AE12370072DaBebaBb19cA64F3570B60",
  orbit_survey_polygon: "0xD4444B05A2D186d663Ff06275f438CC57A1b6447",
  catharsys_polygon: "0xBC182466dFaC2C287c237270d80f0470742BcA53",
  rocifi_polygon: "0xa89670Ec9A265fc097578CF6C19abe506ad97E72",
  factory_v2_arbitrum: "0xD6A947a37cA212fd66151CB6eC35508CdD28C03b",
  nftperp_2_arbitrum: "0x41A00988bBCce8e022B2a9D0dD2bc62bfcB0369A",
  factory_v2_polygon: "0xc1E9c239e93DAC605020175a742e4fCe21CC3355",
  erc2771compatible_factory_polygon: "0xfC1914aa8482927417E1dc0bCD7f728316D40f32",
  erc2771compatible_factory_arbitrum: "0x70E206305Ce5bE5f9d2a35D7b52c6D1eDC492C68",
};

// edit campaign parameters here before deploying
const contractName = "MultiClaimWave";
const campaignName = "My Ecommerce Campaign";
const symbol = "MEC";
const root = "0x0000000000000000000000000000000000000000000000000000000000000000";
const baseURI =
  "https://tideprotocol.infura-ipfs.io/ipfs/QmRdXHTEjSdJLr7WaCEeRAT7uZ1FVK6zkycoi6z8w6vnK8";
const beginTimestamp = 1665525600;
const endTimestamp = 2667343600;

//deployCampaign("MultiClaimWave", campaignName, symbol, root, baseURI, beginTimestamp, endTimestamp);
// fetchRoot(contractName, campaigns.nftperp_wave_final);
// updateBaseURI(contractName, campaigns.nftperp_2_arbitrum, baseURI);
// updateRoot(contractName, campaigns.rocifi_polygon, root);
// claim(contractName, campaigns.nftperp_wave_final);
// deployWaveFactory(
//   "0x607291C9B3b03D8C2DC1F5f7F8db2B6A06C91183",
//   "0x8f5B08237d9aaf212a6ABeF3379149765dEE9C10"
// );
// deployWaveUsingFactory(campaignName, symbol, root, baseURI, beginTimestamp, endTimestamp);
// retreiveAddress();
// award(campaigns.orbit_survey_polygon, [1, 2, 3], "premium-orbit-contributor");
// retrieveTimings(contractName, "0x38d246314e6E56eA568762eeDAb2f04E04dBae21");
// airdrop("0x38d246314e6E56eA568762eeDAb2f04E04dBae21", [
//   { user: "0x7C59Ee5b12f9844B0684C542c9C985266F1B5912", reward: "membership-card" },
//   { user: "0x357047872d12BF5c26C340b87de27412aDe21dd7", reward: "membership-card" },
//   { user: "0xbE7Fe1894d566dbf425e551c733e395b9e9C1d13", reward: "membership-card" },
// ]);
award(
  "0xaA6ecc5f4e6c453D5d4719ea966F8f461519302D",
  Array.from(Array(68).keys()).map((i) => i + 1),
  "membership-card"
);
