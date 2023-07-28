import { ethers } from "hardhat";

export const evm_fast_forward = async (warpDays: number) => {
  const seconds = warpDays * 24 * 60 * 60;
  const result = await ethers.provider.send("evm_increaseTime", [seconds]);
  console.log("fast forward result", result);
};
