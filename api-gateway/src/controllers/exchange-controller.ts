import type { Request, Response } from "express";
import { sendValidationError } from "../utils/validation";
import {
  createOrderDTO,
  onRampDTO,
  offRampDTO,
} from "../validators/exchange-validators";
import {
  BALANCES,
  getOrCreateBalance,
  getOrCreateBook,
  ORDERS,
  OrderStatus,
  OrderType,
  TradeDirection,
  type OrderRecord,
  addRestingOrder,
  MARKETS,
} from "../utils/store";
import { matchTaker } from "../engines/matching-engine";

function getUserId(req: Request): number {
  if (!req.userId) throw new Error("Missing authenticated user");
  return Number(req.userId);
}

//need to add transaction but would be moving on to in memory part now
export const createOrder = async (req: Request, res: Response) => {
  const parsedBody = createOrderDTO.safeParse(req.body);
  const userId = getUserId(req).toString();

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }
  const bal = getOrCreateBalance(userId);
  const { type, direction, price, sym, quantity, leverage } = parsedBody.data;
  try {
    const market = MARKETS.get(sym);
    if (!market) {
      return res.status(400).json({
        error: "UNKNOWN_MARKET",
      });
    }
    if (leverage > market.maxLeverage) {
      return res.status(400).json({
        error: "LEVERAGE_TOO_HIGH",
      });
    }
    if (type === OrderType.market) {
      if (quantity % market.lotSize !== 0) {
        return res.status(400).json({
          error: "BAD_LOT",
        });
      }
      // this will be changed for market orders
      // for this we have to first of all go to the opposite side orderbook
      // and start filling the quantity until the taker quantity is filled
      // once that is done we take the average price and fill that
      // in orders
      // if (price % market.tickSize !== 0) {
      //   return res.status(400).json({
      //     error: "BAD_TICK",
      //   });
      // }
    return res.status(501).json({ error: "NOT_IMPLEMENTED" });
  }
    if (type === OrderType.limit) {
      if (quantity % market.lotSize !== 0) {
        return res.status(400).json({
          error: "BAD_LOT",
        });
      }
      if (price % market.tickSize !== 0) {
        return res.status(400).json({
          error: "BAD_TICK",
        });
      }
      // const cost = price! * quantity;
      const notional = price! * quantity;
      const margin = notional / leverage;
      if (bal.available < margin) {
        return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
      }
      bal.available -= margin;
      bal.locked += margin;

      const orderId = crypto.randomUUID();
      const createdAt = Date.now();
      const record: OrderRecord = {
        orderId,
        userId,
        side: direction,
        type,
        symbol: sym,
        price: price ?? null,
        qty: quantity,
        filledQty: 0,
        status: OrderStatus.open,
        leverage,
        fills: [],
        createdAt,
      };
      ORDERS.set(orderId, record);
      const fills = matchTaker(record);
      if (record.filledQty < record.qty) {
        addRestingOrder(record);
      }
      return res.status(201).json({
        orderId,
        status: record.status,
        filledQty: record.filledQty,
        balance: { available: bal.available, locked: bal.locked },
        fills
      });
    }
  } catch (error) {
    console.error("an error occured while creating order", error);
    return res.status(500).json({
      error: "An error occured while creating order",
    });
  }
};

export const onRamp = async (req: Request, res: Response) => {
  const userId = getUserId(req).toString();
  const parsedBody = onRampDTO.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }
  try {
    const currentBalance = getOrCreateBalance(userId);
    const totalBalance = parsedBody.data.amount + currentBalance.available;
    currentBalance.available = totalBalance;
    return res.status(200).json({
      message: `Balance updated successfully`,
      balance: currentBalance.available,
      locked: currentBalance.locked,
    });
  } catch (error) {
    console.error(`On ramp failed ${error}`);
    return res.status(500).json({
      message: `An error occured while adding balance`,
    });
  }
};
export const offRamp = async (req: Request, res: Response) => {
  const userId = getUserId(req).toString();
  const parsedBody = offRampDTO.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }
  try {
    const currentBalance = getOrCreateBalance(userId);
    const balanceAfterWithdrawl =
      currentBalance.available - parsedBody.data?.amount;
    if (balanceAfterWithdrawl < 0) {
      return res.status(400).json({
        message: "Not enough balance available",
        balance: currentBalance.available,
      });
    }
    currentBalance.available = balanceAfterWithdrawl;
    return res.status(200).json({
      message: "Money withdrawn successfully",
      available: currentBalance.available,
      locked: currentBalance.locked,
    });
  } catch (error) {
    console.error("An error occured while withdrawig balance", error);
    return res.status(500).json({
      message: "An error occured while withdrawig balance",
    });
  }
};
