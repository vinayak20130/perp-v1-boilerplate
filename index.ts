import express from "express";
import { authRouter } from "./src/routes/auth-routes";
import { envs } from "./src/utils/env";
import { dbConnect } from "./src/config/db";

const app = express();
app.use(express.json());

// this is for depositing money
await dbConnect();
app.use("/auth", authRouter);
// async function liqudationChecks(asset: string, price: number) {

// }

app.listen(envs.port, () => {
  console.log("app is listening on the port", envs.port);
});
// async function onPriceUpdateFromBinance(asset: string, price: number) {
//     liqudationChecks(asset, price);
// }
