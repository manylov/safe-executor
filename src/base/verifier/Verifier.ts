/*
 * Copyright (c) 2021. Gearbox
 */
import { LoggedDeployer } from "@gearbox-protocol/devops";
import axios from "axios";
import hre from "hardhat";

export interface VerifyRequest {
  address: string;
  constructorArguments: Array<any>;
}

export interface EtherscanSource {
  sources: Record<
    string,
    {
      content: string;
    }
  >;
}

export class Verifier extends LoggedDeployer {
  protected readonly _apiKey: string;
  protected readonly _networkName: string;
  protected readonly _fileName: string;

  public constructor(protected deployStateSubdir: string) {
    super();
    this._networkName = hre.network.name;

    if (!process.env.ETHERSCAN_API_KEY) {
      throw new Error("No etherscan API provided");
    }

    this._apiKey = process.env.ETHERSCAN_API_KEY;
  }

  async verifyOne(req: VerifyRequest): Promise<boolean> {
    const isVerified = await this.isVerified(req.address);

    if (isVerified) {
      this._logger.debug(`${req?.address} is already verified`);
      return true;
    } else {
      this._logger.info(`Verifying: ${req?.address}`);
      try {
        await hre.run("verify:verify", req);
        this._logger.debug("ok");
        return true;
      } catch (e) {
        this._logger.error(`Failed to verify ${req?.address}`);
        return false;
      }
    }
  }

  protected async isVerified(address: string): Promise<boolean> {
    const url = `${this._baseUrl(
      this._networkName
    )}/api?module=contract&action=getabi&address=${address}&apikey=${
      this._apiKey
    }`;
    const isVerified = await axios.get(url);
    return isVerified.data && isVerified.data.status === "1";
  }

  protected _baseUrl(networkName: string): String {
    switch (networkName) {
      case "mainnet":
        return "https://api.etherscan.io";
      case "arbitrum":
        return "https://api.arbicscan.io";
      default:
        throw new Error(`${networkName} is not supported`);
    }
  }
}
