import type { Request, Response } from "express";

import { sendValidationError } from "../utils/validation";
import { prisma } from "../config/db";
import { createOrderDTO } from "../validators/exchange-validators";
import { OrderStatus, OrderType, TradeDirection } from "../utils/store";

function getUserId(req: Request): number {
  if (!req.userId) throw new Error("Missing authenticated user");
  return Number(req.userId);
}

//need to add transaction but would be moving on to in memory part now
const createOrder = async (req: Request, res: Response) => {
  const parsedBody = createOrderDTO.safeParse(req.body);
  const userId = getUserId(req);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }
  const { type, direction, price, sym, quantity } = parsedBody.data;
  try {
    if (type === OrderType.limit) {
      const takeOrder = await prisma.orders.create({
        data: {
          userId,
          sym,
          price,
          quantity,
          direction,
          type,
          status: OrderStatus.open,
        },
      });
      // buyer needs to buy at the least price possible but u send a price at which seller
      // was already present u wanted to become maker but u became taker so fee badhega
      let existingOrdersPrice;
      if (direction === TradeDirection.buy) {
        existingOrdersPrice = await prisma.orders.findMany({
          where: {
            price: { lte: price },
            sym,
            direction: TradeDirection.sell,
            status: { in: [OrderStatus.open, OrderStatus.partially_filled] },
          },
          orderBy: [{ price: "asc" }, { createdAt: "asc" }],
        });
        // seller needs to sell at the max price possible but u send a price at which buyer was already present
      } else {
        existingOrdersPrice = await prisma.orders.findMany({
          where: {
            price: { gte: price },
            sym,
            direction: TradeDirection.buy,
            status: { in: [OrderStatus.open, OrderStatus.partially_filled] },
          },
          orderBy: [{ price: "desc" }, { createdAt: "asc" }],
        });
      }
      // I will get full object here but I won't get how may quantity has been filled need to check fill array for it
      // now I need to check the last fill quantity for the  order and fill it
      // i will update fill for both the orders and then update the quantity and status in orders table and also update the fills array
      //   fill code krne ka code order status wagera update krne ka code

      let remaining = quantity;
      for (const maker of existingOrdersPrice) {
        if (remaining === 0) {
          break;
        }
        const makerRemaining = maker.quantity - maker.filledQuantity;
        const fillQty = Math.min(remaining, makerRemaining);

        await prisma.fills.create({
          data: {
            userId,
            takerOrderId: takeOrder.id,
            makerOrderId: maker.id,
            filledQuantity: fillQty,
            fillPrice: maker.price,
          },
        });
        await prisma.orders.update({
          where: { id: maker.id },
          data: {
            filledQuantity: { increment: fillQty },
            status:
              makerRemaining === fillQty
                ? OrderStatus.filled
                : OrderStatus.partially_filled,
          },
        });
        await prisma.orders.update({
          where: { id: takeOrder.id },
          data: {
            filledQuantity: { increment: fillQty },
            status:
              remaining === fillQty
                ? OrderStatus.filled
                : OrderStatus.partially_filled,
          },
        });
        remaining -= fillQty;

        // now this is new case
        // abb existing order hai hi nhi koi to seedha ye jaake order book pr baithega
        // iska matlab ki ek nya order create hoga order table mei and order book mei
        // abhi kae liye lets create a new order
      }
    }
  } catch (error) {}
};
