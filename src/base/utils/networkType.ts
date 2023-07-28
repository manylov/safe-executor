import { detectNetwork } from "@gearbox-protocol/devops";
import { NetworkType, getNetworkType } from "@gearbox-protocol/sdk";
import { ethers } from "hardhat";

export const detectNetworkType = async (): Promise<NetworkType> => {
  const chainId = await (await ethers.getSigners())[0].getChainId();
  return chainId === 31337 || chainId === 1337
    ? await detectNetwork()
    : getNetworkType(chainId);
};
