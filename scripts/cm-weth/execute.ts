import { TxManager } from "../../src/base/TxManager";
import { evm_fast_forward } from "../../src/base/utils/warp";

const warpDays = 3;

const main = async () => {
  await evm_fast_forward(warpDays);

  const txManager = new TxManager({
    dir: "cm-weth/setup-txs",
    clear: false, // use txs generated
  });

  await txManager.callTxsFromSafeImpersonatedAccount("execute");
};

main();
