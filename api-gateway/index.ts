import express from "express";
import { authRouter } from "./src/routes/auth-routes";
import { envs } from "./src/utils/env";
import { dbConnect } from "./src/config/db";
import { exchangeRouter } from "./src/routes/exchange-routes";
import { BALANCES } from "./src/utils/store";
import { startBinanceFeed } from "./src/engines/liquidation-engine";
  startBinanceFeed(["SOL-PERP", "ETH-PERP"]);

const app = express();
app.use(express.json());

// this is for depositing money
await dbConnect();
// add mock balances for now to simulate mock trades
BALANCES.set("1", { USD: { available: 10000, locked: 0 } });
app.use("/auth", authRouter);
app.use("/exchange", exchangeRouter);
// async function liqudationChecks(asset: string, price: number) {

// }

app.listen(envs.port, () => {
  console.log("app is listening on the port", envs.port);
});
// async function onPriceUpdateFromBinance(asset: string, price: number) {
//     liqudationChecks(asset, price);
// }
