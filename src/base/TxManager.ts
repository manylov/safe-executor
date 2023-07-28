import { TransactionReceipt } from "@ethersproject/providers";
import { LoggedDeployer } from "@gearbox-protocol/devops";

import * as fs from "fs";
import path from "path";
import { TimelockAction } from "./types";
import { generateBatchFile } from "./safe";
import { addChecksum } from "./safe/checksum";
import { ProposedTransaction } from "./safe/models";
import { BigNumber, Contract, ContractTransaction } from "ethers";
import { String } from "ts-toolbelt";
import { ethers, network } from "hardhat";

import {
  HARDHAT_NETWORK,
  LOCAL_NETWORK,
  MULTISIG,
  TIMELOCK,
  formatBN,
} from "@gearbox-protocol/sdk";
import { TestnetsOnly } from "./decorators";
import { impersonate } from "./utils/impersonate";
import { detectNetworkType } from "./utils/networkType";

export type TxExecutionStatus = {
  id: number;
  comment: string;
  status: "new" | "sent";
};

export type BachTransaction = {
  to: string;
  value: string;
  contractMethod: {
    inputs: any[];
    name: string;
    payable: boolean;
  };
  contractInputsValues: Record<string, any>;
};

type TxsForSafe = { [k in TimelockAction]: ProposedTransaction[] };

type TxExecutions = { [k in TimelockAction]: TxExecutionStatus[] };

export class TxManager extends LoggedDeployer {
  #safeTxs: TxsForSafe;
  #executionStatus: TxExecutions;
  // #initializer: Initializer;

  #queueSafeTxsFile = "queue_safeTxs.json";
  #executeSafeTxsFile = "execute_safeTxs.json";
  #queueExecutionStatusFile = "queue_executionStatus.json";
  #executeExecutionStatusFile = "execute_executionStatus.json";
  #deployerExecutionStatusFile = "deployer_executionStatus.json";
  #deployerTxsFile = "deployer_txs.json";

  txsDir: string;

  constructor(args: {
    dir: string;
    // initializer: Initializer;
    clear?: boolean;
  }) {
    super();
    this.enableLogs();
    // this.#initializer = args.initializer;

    const txsDir = path.resolve(
      process.cwd(),
      "deploy-state",
      network.name,
      args.dir
    );

    if (!fs.existsSync(txsDir)) {
      fs.mkdirSync(txsDir, { recursive: true });
    }

    this.#queueSafeTxsFile = path.join(txsDir, this.#queueSafeTxsFile);
    this.#executeSafeTxsFile = path.join(txsDir, this.#executeSafeTxsFile);
    this.#queueExecutionStatusFile = path.join(
      txsDir,
      this.#queueExecutionStatusFile
    );
    this.#executeExecutionStatusFile = path.join(
      txsDir,
      this.#executeExecutionStatusFile
    );

    this.#deployerExecutionStatusFile = path.join(
      txsDir,
      this.#deployerExecutionStatusFile
    );
    this.#deployerTxsFile = path.join(txsDir, this.#deployerTxsFile);

    this.#safeTxs = {} as TxsForSafe;
    this.#executionStatus = {} as TxExecutions;

    if (
      fs.existsSync(this.#queueSafeTxsFile) &&
      fs.existsSync(this.#executeSafeTxsFile) &&
      fs.existsSync(this.#deployerTxsFile)
    ) {
      const queueSafeTxsFileContent = fs.readFileSync(
        this.#queueSafeTxsFile,
        "utf-8"
      );
      const executeSafeTxsFileContent = fs.readFileSync(
        this.#executeSafeTxsFile,
        "utf-8"
      );
      const deployerTxsFileContent = fs.readFileSync(
        this.#deployerTxsFile,
        "utf-8"
      );

      this.#safeTxs["queue"] = JSON.parse(
        queueSafeTxsFileContent
      ) as ProposedTransaction[];
      this.#safeTxs["execute"] = JSON.parse(
        executeSafeTxsFileContent
      ) as ProposedTransaction[];

      this.#safeTxs["deployer"] = JSON.parse(
        deployerTxsFileContent
      ) as ProposedTransaction[];
    } else {
      this.#safeTxs = {
        queue: [],
        execute: [],
        deployer: [],
      } as TxsForSafe;
    }

    if (
      fs.existsSync(this.#queueExecutionStatusFile) &&
      fs.existsSync(this.#executeExecutionStatusFile) &&
      fs.existsSync(this.#deployerExecutionStatusFile)
    ) {
      const queueExecutionFileContent = fs.readFileSync(
        this.#queueExecutionStatusFile,
        "utf-8"
      );
      const executeExecutionFileContent = fs.readFileSync(
        this.#executeExecutionStatusFile,
        "utf-8"
      );

      const deployerExecutionFileContent = fs.readFileSync(
        this.#deployerExecutionStatusFile,
        "utf-8"
      );

      this.#executionStatus["queue"] = JSON.parse(
        queueExecutionFileContent
      ) as TxExecutionStatus[];

      this.#executionStatus["execute"] = JSON.parse(
        executeExecutionFileContent
      ) as TxExecutionStatus[];

      this.#executionStatus["deployer"] = JSON.parse(
        deployerExecutionFileContent
      ) as TxExecutionStatus[];
    } else {
      this.#executionStatus = {
        queue: [],
        execute: [],
        deployer: [],
      } as TxExecutions;
    }

    this.save();

    if (args.clear) {
      this.clear();
    }

    this.txsDir = txsDir;
  }

  generateBatchFiles(args: { description: string; chainId: number }) {
    const { description, chainId } = args;
    this.generateBatchFile("queue", description, chainId);
    this.generateBatchFile("execute", description, chainId);
    this._logger.info("Batch files generated in", this.txsDir);
  }

  generateBatchFile(
    action: TimelockAction,
    description: string,
    chainId: number,
    safeAddress?: string
  ) {
    const fileName = `batch-${action}.json`;

    const batchFilePath = path.join(this.txsDir, fileName);

    const batchFile = addChecksum(
      generateBatchFile({
        name: fileName,
        description,
        transactions: this.#safeTxs[action],
        chainId,
        safeAddress,
      })
    );

    fs.writeFileSync(batchFilePath, JSON.stringify(batchFile, null, 2));
  }

  getBatchTxs(action: TimelockAction) {
    const fileName = `batch-${action}.json`;

    const batchFilePath = path.join(
      this.txsDir,

      fileName
    );

    if (!fs.existsSync(batchFilePath)) {
      throw new Error("Batch file does not exist here: " + batchFilePath);
    }

    const batchFileContent = fs.readFileSync(batchFilePath, "utf-8");

    const batchFile = JSON.parse(batchFileContent);

    return batchFile.transactions as Array<BachTransaction>;
  }

  clear() {
    this.#safeTxs = {
      queue: [],
      execute: [],
      deployer: [],
    };

    this.#executionStatus = {
      queue: [],
      execute: [],
      deployer: [],
    };

    this.save();
  }

  save() {
    fs.writeFileSync(
      this.#queueSafeTxsFile,
      JSON.stringify(this.#safeTxs["queue"], null, 2)
    );
    fs.writeFileSync(
      this.#executeSafeTxsFile,
      JSON.stringify(this.#safeTxs["execute"], null, 2)
    );
    fs.writeFileSync(
      this.#queueExecutionStatusFile,
      JSON.stringify(this.#executionStatus["queue"], null, 2)
    );
    fs.writeFileSync(
      this.#executeExecutionStatusFile,
      JSON.stringify(this.#executionStatus["execute"], null, 2)
    );

    fs.writeFileSync(
      this.#deployerExecutionStatusFile,
      JSON.stringify(this.#executionStatus["deployer"], null, 2)
    );
    fs.writeFileSync(
      this.#deployerTxsFile,
      JSON.stringify(this.#safeTxs["deployer"], null, 2)
    );
  }

  addTx(tx: ProposedTransaction, comment: string, action: TimelockAction) {
    this.#safeTxs[action].push(tx);

    this.#executionStatus[action].push({
      id: this.#executionStatus[action].length,
      comment,
      status: "new",
    });

    this.save();
  }

  markTxExecuted(id: number, action: TimelockAction) {
    this.#executionStatus[action][id].status = "sent";
    this.save();
  }

  isTxSent(id: number, action: TimelockAction) {
    return this.#executionStatus[action][id].status === "sent";
  }

  getTxComment(id: number, action: TimelockAction) {
    return this.#executionStatus[action][id].comment;
  }

  async _addTxToSafe<
    T extends Contract,
    U extends String.Split<string & keyof T["interface"]["functions"], "(">[0],
    V extends Parameters<T[U]>
  >(callArgs: {
    contract: T;
    method: U;
    args: V;
    comment: string;
    action: TimelockAction;
  }) {
    const { contract, method, args, comment, action } = callArgs;
    const calldata = await contract.populateTransaction[method](...args);
    if (!calldata.data) throw new Error("no calldata.data");

    const abi = JSON.parse(
      contract.interface.getFunction(method).format("json")
    );
    abi.inputs[0].internalType = "address[]";

    const contractFieldsValues: Record<string, string> = {};

    args.forEach((arg, index) => {
      const methodName =
        contract.interface.getFunction(method).inputs[index].name;

      let stringifiedArg = arg instanceof BigNumber ? arg.toString() : arg;

      // @ts-ignore
      contractFieldsValues[methodName] = Array.isArray(stringifiedArg)
        ? JSON.stringify(stringifiedArg)
        : stringifiedArg;
    });

    const tx: ProposedTransaction = {
      description: {
        to: contract.address,
        value: "0",
        contractMethod: {
          inputs: abi.inputs,
          name: abi.name,
          payable: abi.payable,
        },
        contractFieldsValues,
      },
      raw: {
        to: contract.address,
        value: "0",
        data: calldata.data,
      },
    };

    this.addTx(tx, comment, action);
  }

  @TestnetsOnly()
  async callTxsFromSafeImpersonatedAccount(
    action: TimelockAction,
    signerAddress?: string
  ) {
    const multisig = MULTISIG[await detectNetworkType()];
    const signer = signerAddress
      ? await impersonate(signerAddress, true)
      : await impersonate(multisig, true);

    this._logger.info("Start calling txs from safe");

    // read json from txs.json file with fs.readFileSync

    const txsToExecute = this.getBatchTxs(action);

    for (let i = 0; i < txsToExecute.length; i++) {
      const txComment = this.getTxComment(i, action);
      // const isTxSent = await this.isTxSent(i, action);
      // if (isTxSent) {
      //   this._logger.info("tx", txComment, "already sent");
      //   continue;
      // }

      this._logger.info("tx", txComment);
      const tx = txsToExecute[i];

      const abi = [
        {
          name: tx.contractMethod.name,
          inputs: tx.contractMethod.inputs,
          outputs: [],
          stateMutability: tx.contractMethod.payable ? "payable" : "nonpayable",
          type: "function",
        },
      ];

      // console.log("abi", JSON.stringify(abi, null, 2));

      // console.log("data", tx.to, abi);

      const contract = new ethers.Contract(tx.to, abi, signer);

      const functionName = tx.contractMethod.name;

      // console.log("tx.contractInputsValues", tx.contractInputsValues);
      const functionParams = Object.values(tx.contractInputsValues);
      const overrides = {
        value: tx.value,
      };

      const recieptTx = await contract[functionName](
        ...functionParams,
        overrides
      );

      await this.waitForTransaction(recieptTx);

      this.markTxExecuted(i, action);
    }
  }

  async printReceipt(txReceipt: TransactionReceipt) {
    this._logger.debug(`Tx sent: ${txReceipt.transactionHash}`);

    const priceInfo = txReceipt.effectiveGasPrice
      ? `@ ${formatBN(txReceipt.effectiveGasPrice, 9)} gwei.  Total: ${formatBN(
          txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice),
          18
        )} ETH`
      : "";
    this._logger.debug(
      `Gas used: ${txReceipt.gasUsed.toString()} ${priceInfo}`
    );
  }

  async waitForTransaction(
    transaction: ContractTransaction
  ): Promise<TransactionReceipt> {
    const txReceipt = await transaction.wait(await this.waitingTime());
    this.printReceipt(txReceipt);
    return txReceipt;
  }

  async waitingTime() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const chainId = await deployer.getChainId();

    const waitingTime =
      [LOCAL_NETWORK, HARDHAT_NETWORK].includes(chainId) ||
      ["devnet", "tenderly", "localhost"].includes(network.name)
        ? 1
        : 4;

    console.log(
      `Waiting ${waitingTime} confirmations for the transaction to be mined...`
    );

    return waitingTime;
  }

  async callTxsFromDeployer() {
    const signer = (await ethers.getSigners())[0];

    this._logger.info(
      "Start calling txs from deployer account",
      signer.address
    );

    const action = "deployer";

    const txsToExecute = this.#safeTxs[action];

    for (let i = 0; i < txsToExecute.length; i++) {
      const txComment = this.getTxComment(i, action);
      const isTxSent = this.isTxSent(i, action);
      if (isTxSent) {
        this._logger.info("tx", txComment, "already sent");
        continue;
      }

      const txData = txsToExecute[i];

      const txCall = {
        to: txData.raw.to,
        data: txData.raw.data,
      };

      this._logger.info("sending tx", txComment);

      const tx = await signer.sendTransaction({
        ...txCall,
      });

      await this.waitForTransaction(tx);

      this.markTxExecuted(i, action);
    }
  }

  @TestnetsOnly()
  async callTxsFromTxsFile(action: TimelockAction, signerAddress?: string) {
    const deployer = (await ethers.getSigners())[0];

    const signer = signerAddress
      ? await impersonate(signerAddress, true)
      : deployer;

    this._logger.info("Start calling txs from safe");

    const txsToExecute = this.#safeTxs[action];

    for (let i = 0; i < txsToExecute.length; i++) {
      const txComment = this.getTxComment(i, action);
      const isTxSent = this.isTxSent(i, action);
      if (isTxSent) {
        this._logger.info("tx", txComment, "already sent");
        continue;
      }

      const txData = txsToExecute[i];

      const tx = {
        to: txData.raw.to,
        data: txData.raw.data,
      };

      this._logger.info("sending tx", txComment);

      const recieptTx = await signer.sendTransaction({
        ...tx,
      });

      await this.waitForTransaction(recieptTx);

      this.markTxExecuted(i, action);
    }
  }
}
