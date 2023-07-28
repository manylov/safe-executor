import { ethers, network } from "hardhat";

export const impersonate = async (
  address: string,
  setBalance: boolean = false
) => {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  await network.provider.request({
    method: "hardhat_setCode",
    params: [address, "0x"],
  });

  if (setBalance) {
    await network.provider.send("hardhat_setBalance", [
      address,
      "0x10000000000000000000",
    ]);
  }

  const signer = await ethers.getSigner(address);

  return signer;
};
