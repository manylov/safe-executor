import { network } from "hardhat";

export function ShouldBeInitialized() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      //@ts-ignore
      if (this["initializer"]["initialized"] !== true) {
        throw new Error("Deployer is not initialized.");
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function TestnetsOnly() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (network.name === "mainnet") {
        throw new Error("This function can not be called on mainnet");
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
