import { TxManager } from "../../src/base/TxManager";
import { evm_fast_forward } from "../../src/base/utils/warp";

const warpDays = 2;

const main = async () => {
  const txManagerPhantom = new TxManager({
    dir: "cm-weth/phantom-unpause",
    clear: false, // use txs generated
  });

  console.log("FAST FORWARD EVM FOR 2 days");
  await evm_fast_forward(warpDays);

  console.log("EXECUTE ADDITIONAL PHANTOM AND UNLOCK TXS");
  await txManagerPhantom.callTxsFromSafeImpersonatedAccount("execute");

  console.log("DONE");
};

main();
