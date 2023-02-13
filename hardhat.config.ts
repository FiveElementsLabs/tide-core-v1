import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import { HardhatUserConfig } from "hardhat/types";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const hardhat: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: { yul: true },
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: { yul: true },
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: { yul: true },
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.ALCHEMY_POLYGON || "",
        blockNumber: 15000000,
      },
    },
    mumbai: {
      url: process.env.ALCHEMY_MUMBAI || "",
      accounts: [process.env.PVTKEY_MUMBAI || ""],
    },
    polygon: {
      url: process.env.ALCHEMY_POLYGON || "",
      accounts: [process.env.PVTKEY_POLYGON || ""],
    },
    arbitrum: {
      url: process.env.ALCHEMY_ARBITRUM || "",
      accounts: [process.env.PVTKEY_ARBITRUM || ""],
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET || "",
      accounts: [process.env.PVTKEY_MAINNET || ""],
    },
    optimism: {
      url: process.env.ALCHEMY_OPTIMISM || "",
      accounts: [process.env.PVTKEY_OPTIMISM || ""],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  mocha: { timeout: 100000 },
};

export default hardhat;
