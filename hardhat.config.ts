import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import { node_url } from "./utils/config-helpers";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import { validateEnvs } from "./utils/validate-env";

validateEnvs();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        enabled: true,
        url: node_url("MAINNET"),
      },
    },

    localhost: {
      timeout: 600_000,
    },
  },
};

export default config;
