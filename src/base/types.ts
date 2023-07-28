import { adapters } from "./../../deploy-settings/settings";
import {
  NetworkType,
  SupportedContract,
  SupportedToken,
} from "@gearbox-protocol/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { Add } from "ts-toolbelt/out/Number/Add";

export type Address = string;

export type OnchainCreditManagersSettings = {
  address: Address;
  underlyingTokenSymbol: SupportedToken;
  newCurrentTotalDebt: string;
  newLimit: string;
};

export type InitialCreditManagersSettings = {
  address: Address;
  underlyingTokenSymbol: SupportedToken;
  newCurrentTotalDebt: BigNumber;
  newLimit: BigNumber;
};

export type DeployedAdapters = { [k in SupportedContract]: Address };

export type CreditManagerRecord = {
  creditFacade: Address;
  creditConfigurator: Address;
  adapters: DeployedAdapters;
};

export type CreditManagers = {
  [address in Address]: Partial<CreditManagerRecord>;
};

type ContractId = string;

export type ContractDeployData = {
  contractName: string;
  contractAddress: Address;
  constructorArguments: any[];
  verify: boolean;
  verified: boolean;
  githubChecked: boolean;
};

export type DeployStatus = Record<ContractId, ContractDeployData>;

type CollateralToken = {
  token: SupportedToken;
  liquidationThreshold: number;
};

export type CreditManagerOpts = {
  minBorrowedAmount: BigNumber;
  maxBorrowedAmount: BigNumber;
  collateralTokens: CollateralToken[];
  degenNFT: Address;
  blacklistHelper: Address;
  expirable: boolean;
};

export type CreditManagersConfig = {
  [netword in NetworkType]: {
    [token in SupportedToken]: Omit<
      CreditManagerOpts,
      "degenNFT" | "blacklistHelper" | "expirable"
    >;
  };
};

export type DeployedContracts = {
  [netword in NetworkType]: {
    [token in SupportedToken]: {
      [type in "CreditConfigurator" | "CreditFacade"]: string;
    };
  };
};

/*
{
    "txs": [
        {
            "to": "0x1234567890123456789012345678901234567890",
            "value": "1000000000000000000",
            "data": "0x",
            "operation": 0
        },
        {
            "to": "0x0987654321098765432109876543210987654321",
            "value": "2000000000000000000",
            "data": "0x",
            "operation": 0
        }
    ],
    "nonce": 1,
    "gasPrice": "1000000000",
    "gasToken": "0x0000000000000000000000000000000000000000",
    "refundReceiver": "0x0000000000000000000000000000000000000000",
    "safeTxGas": 50000,
    "baseGas": 0,
    "gasPriceCeil": "0",
    "signatures": []
}
*/

export type SafeTransaction = {
  to: Address;
  value: string;
  data: string;
  operation: number;
};

export type TxEncoded = {
  to: Address;
  value: string;
  data: string;
  operation: number;
};

export type OldAdaptersData = { [contract in SupportedContract]: Address };

export type CreditManagerAddress = Address;

export type AllOldAdaptersData = {
  [x in CreditManagerAddress]: OldAdaptersData;
};

export function hasDefinedProp<
  Obj extends Partial<Record<string, any>>,
  Prop extends string
>(
  obj: Obj,
  prop: Prop
): obj is Obj &
  Record<
    Prop,
    Prop extends keyof Obj ? Exclude<Obj[Prop], undefined> : unknown
  > {
  return obj[prop] !== undefined;
}

export type TimelockAction = "queue" | "execute" | "deployer";

type CMCollateralToken = {
  symbol: SupportedToken;
  liquidationThreshold: number;
};

export type CMSettings = {
  poolAddress: Address;
  emergencyLiquidationDiscount: number;
  emergencyLiquidators: Address[];
  isDegenNft: boolean;
  isBlackListHelper: boolean;
  minBorrowedAmount: BigNumberish;
  maxBorrowedAmount: BigNumberish;
  totalDebtLimit: BigNumberish;
  collateralTokens: CMCollateralToken[];
  adapters: SupportedContract[];
};
