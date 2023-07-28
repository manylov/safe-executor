import { BatchFile, BatchTransaction, ProposedTransaction } from "./models";

export const generateBatchFile = ({
  name,
  description,
  transactions,
  chainId,
  safeAddress,
}: {
  name: string;
  description: string;
  transactions: ProposedTransaction[];
  chainId: number;
  safeAddress?: string;
}): BatchFile => {
  return {
    version: "1.0",
    chainId: `${chainId}`,
    createdAt: Date.now(),
    meta: {
      name,
      description,
      txBuilderVersion: "1.16.0",
      createdFromSafeAddress: safeAddress ?? process.env.MULTISIG,
      createdFromOwnerAddress: "",
    },
    transactions: convertToBatchTransactions(transactions),
  };
};

const convertToBatchTransactions = (
  transactions: ProposedTransaction[]
): BatchTransaction[] => {
  // console.log("transactions", JSON.stringify(transactions, null, 2));
  return transactions.map(
    ({ description }: ProposedTransaction): BatchTransaction => ({
      to: description.to,
      value: description.value,
      contractMethod: description.contractMethod,
      contractInputsValues: description.contractFieldsValues,
    })
  );
};
