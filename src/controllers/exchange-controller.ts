import type { Request, Response } from "express";
import { sendValidationError } from "../utils/validation";
import { createOrderDTO } from "../validators/exchange-validators";
import {
  getOrCreateBalance,
  getOrCreateBook,
  ORDERS,
  OrderStatus,
  OrderType,
  TradeDirection,
  type OrderRecord,
  type RestingOrder,
} from "../utils/store";

function getUserId(req: Request): number {
  if (!req.userId) throw new Error("Missing authenticated user");
  return Number(req.userId);
}

//need to add transaction but would be moving on to in memory part now
export const createOrder = async (req: Request, res: Response) => {
  const parsedBody = createOrderDTO.safeParse(req.body);
  const userId = getUserId(req).toString();
  const bal = getOrCreateBalance(userId);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }

  const { type, direction, price, sym, quantity } = parsedBody.data;
  try {
    if (type === OrderType.limit && direction === TradeDirection.buy) {
      const cost = price! * quantity;
      if (bal.available < cost) {
        return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
      }
      bal.available -= cost;
      bal.locked += cost;
    }
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
      fills: [],
      createdAt,
    };
    ORDERS.set(orderId, record);

    if (type === OrderType.limit) {
        const book = getOrCreateBook(sym);
        const side = direction === TradeDirection.buy ? book.bids : book.asks;
        const resting : RestingOrder = {
            orderId,
            userId,
            side:direction,
            type:OrderType.limit,
            symbol: sym,
            price: price!,
            qty: quantity,
            filledQty: 0,
            status: OrderStatus.open,
            createdAt
        }
        const level = side.get(price!) ?? [];
        level.push(resting);
        side.set(price!,level);
    }
    return res.status(201).json({
      orderId,
      status: record.status,
      filledQty: record.filledQty,
      balance: { available: bal.available, locked: bal.locked },
    });

  } catch (error) {
    console.error('an error occured while creating order', error)
    return res.status(500).json({
        error: 'An error occured while creating order'
    })
  }
};
