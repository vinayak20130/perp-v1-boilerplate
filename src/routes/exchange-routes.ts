// app.post("/onramp")
// // this is for creating orders
// app.post("/order")
// // this is for cancelling open orders
// app.delete("/order")
// // get all assets which user has
// app.get("/equity/available")
// // open positions 
// app.get("/positions/open/:marketId");
// // closed positions
// app.get("/positions/closed/:marketId");
// // open orders
// app.get("/orders/open/:marketId")
// //get all the orders
// app.get("/orders/:marketId")
// // to get all the fills that are done in all the orders

import { Router } from "express";
import { createOrder } from "../controllers/exchange-controller";

// app.get("/fills");
export const exchangeRouter  = Router();

exchangeRouter.post('/order',createOrder)