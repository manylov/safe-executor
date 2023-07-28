import { FunctionFragment } from "ethers/lib/utils";

export type ContractMethod = {
  inputs: any[];
  name: string;
  payable: boolean;
};

export interface ProposedTransaction {
  description: {
    to: string;
    value: string;
    contractMethod: ContractMethod;
    contractFieldsValues: Record<string, string>;
  };
  raw: { to: string; value: string; data: string };
}

export interface BatchFile {
  version: string;
  chainId: string;
  createdAt: number;
  meta: BatchFileMeta;
  transactions: BatchTransaction[];
}

export interface BatchFileMeta {
  txBuilderVersion?: string;
  checksum?: string;
  createdFromSafeAddress?: string;
  createdFromOwnerAddress?: string;
  name: string;
  description?: string;
}

export interface BatchTransaction {
  to: string;
  value: string;
  data?: string;
  contractMethod?: ContractMethod;
  contractInputsValues?: { [key: string]: string };
}

export interface ContractInput {
  internalType: string;
  name: string;
  type: string;
}
