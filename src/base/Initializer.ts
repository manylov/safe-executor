import { LoggedDeployer, detectNetwork } from "@gearbox-protocol/devops";

import { ethers, network } from "hardhat";

import {
  formatBN,
  NetworkType,
  ADDRESS_PROVIDER,
  MULTISIG,
  TIMELOCK,
  CREATE2FACTORY,
} from "@gearbox-protocol/sdk";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  ACL,
  ACL__factory,
  AddressProvider,
  AddressProvider__factory,
  ContractsRegister,
  ContractsRegister__factory,
  Create2Deployer,
  Create2Deployer__factory,
  DataCompressor,
  DataCompressor__factory,
  PriceOracle,
  PriceOracle__factory,
  Timelock,
  Timelock__factory,
} from "../../typechain-types";

import { BigNumberish } from "ethers";

import { Logger } from "tslog";
import { impersonate } from "./utils/impersonate";
import { detectNetworkType } from "./utils/networkType";

const deployerAddress = "0x20da9f3d7d5cb96c2822338830cfd6dee6d508d8";

export interface GasFee {
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
}

export class Initializer extends LoggedDeployer {
  initialized = false;

  _accounts: Array<SignerWithAddress>;
  deployer: SignerWithAddress;

  chainId: number;
  networkType: NetworkType;
  multisig: string;

  addressProvider: AddressProvider;
  create2Factory: Create2Deployer;
  acl: ACL;
  timelock: Timelock;
  contractsRegister: ContractsRegister;
  dataCompressor: DataCompressor;
  priceOracle: PriceOracle;

  dataDir: string;
  gasFee: GasFee;
  logger: Logger;

  constructor() {
    super();
    this.enableLogs();
    this.logger = this._logger;
  }

  async init() {
    if (this.initialized) {
      throw new Error("Deployer has been already initialized");
    }

    this._accounts = await ethers.getSigners();
    this.deployer = this._accounts[0];
    this.chainId = await this.deployer.getChainId();
    this.networkType = await detectNetworkType();

    this._logger.info("networkType", this.networkType);
    this._logger.info("chainId", this.chainId);
    this._logger.info("network.name", network.name);

    switch (this.chainId) {
      // MAINNET
      case 1:
        break;

      // FORK HARDHAT
      case 31337:
        this.deployer = await impersonate(deployerAddress);
        break;

      case 1337:
        this.deployer = await impersonate(deployerAddress);
        break;

      // TENDERLY DEVNET
      case 123456: // for custom chainId with tederly devnet template
        this.deployer = await ethers.getSigner(deployerAddress);
        break;

      // UNKNOWN NETWORK
      default:
        throw new Error("unknown network");
    }

    this.multisig = MULTISIG[this.networkType];
    this._logger.info(`Multisig: ${this.multisig}`);

    const addressProvider = ADDRESS_PROVIDER[this.networkType];
    this._logger.info(`AddressProvider: ${addressProvider}`);

    const timelockAddress = TIMELOCK[this.networkType];
    this._logger.info("Timelock:", timelockAddress);

    const create2FactoryAddress = CREATE2FACTORY[this.networkType];
    this._logger.info("Create2Factory:", create2FactoryAddress);

    this.addressProvider = AddressProvider__factory.connect(
      addressProvider,
      this.deployer
    );

    this.acl = ACL__factory.connect(
      await this.addressProvider.getACL(),
      this.deployer
    );

    this.timelock = Timelock__factory.connect(timelockAddress, this.deployer);

    this.contractsRegister = ContractsRegister__factory.connect(
      await this.addressProvider.getContractsRegister(),
      this.deployer
    );

    this.dataCompressor = DataCompressor__factory.connect(
      await this.addressProvider.getDataCompressor(),
      this.deployer
    );

    this.create2Factory = Create2Deployer__factory.connect(
      create2FactoryAddress,
      this.deployer
    );

    this.priceOracle = PriceOracle__factory.connect(
      await this.addressProvider.getPriceOracle(),
      this.deployer
    );

    this._logger.info("Deployer:", this.deployer.address);

    const deployerBalance = await this.deployer.getBalance();
    this._logger.debug("Deployer ETH balance:", formatBN(deployerBalance, 18));

    this.initialized = true;
  }
}
