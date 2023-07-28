import {
  NetworkType,
  SupportedToken,
  tokenDataByNetwork,
} from "@gearbox-protocol/sdk";

export const getTokenAddressFromSdkForChainByName = (
  chainId: NetworkType,
  token: SupportedToken
): string => {
  return tokenDataByNetwork[chainId][token];
};

export const getTokenData = (
  chainId: NetworkType,
  data: { symbol: string; liquidationThreshold: number }[]
): { token: string; liquidationThreshold: number }[] => {
  const result: { token: string; liquidationThreshold: number }[] = [];
  data.forEach((tokenData) => {
    const tokenAddress = getTokenAddressFromSdkForChainByName(
      chainId,
      tokenData.symbol as SupportedToken
    );
    result.push({
      token: tokenAddress,
      liquidationThreshold: tokenData.liquidationThreshold * 100,
    });
  });
  return result;
};
