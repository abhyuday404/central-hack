import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    ...(sepoliaRpcUrl && sepoliaPrivateKey
      ? {
          sepolia: {
            type: "http",
            chainType: "l1",
            url: sepoliaRpcUrl,
            accounts: [sepoliaPrivateKey],
          },
        }
      : {}),
  },
});
