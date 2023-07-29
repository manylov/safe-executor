import { TxManager } from "../../src/base/TxManager";
import { evm_fast_forward } from "../../src/base/utils/warp";

const warpDays = 4;

const main = async () => {
  console.log("QUEUE ADDITIONAL PHANTOM TOKEN TX");
  const txManagerPhantom = new TxManager({
    dir: "cm-weth/phantom",
    clear: false, // use txs generated
  });

  await txManagerPhantom.callTxsFromSafeImpersonatedAccount("queue");

  console.log("FAST FORWARD EVM TO 4 days");
  await evm_fast_forward(warpDays);

  const txManager = new TxManager({
    dir: "cm-weth/setup-txs",
    clear: false, // use txs generated
  });

  console.log("EXECUTE CM WETH SETUP TXS");
  await txManager.callTxsFromSafeImpersonatedAccount("execute");

  console.log("EXECUTE ADDITIONAL PHANTOM TOKEN TX");
  await txManagerPhantom.callTxsFromSafeImpersonatedAccount("execute");

  console.log("DONE");
};

main();
