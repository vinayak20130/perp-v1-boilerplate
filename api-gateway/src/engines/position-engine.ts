import {
  FILLS,
  getOrCreateBalance,
  getOrCreateUserPosition,
  getPosition,
  ORDERBOOKS,
  ORDERS,
  OrderStatus,
  TradeDirection,
  type Balance,
  type Fill,
  type OrderRecord,
} from "../Exchange";

export function applyFillsToPositions(fills: Fill[]): void {
  for (const fill of fills) {
    const buyOrder = ORDERS.get(fill.buyOrderId);
    const sellOrder = ORDERS.get(fill.sellOrderId);

    if (!buyOrder || !sellOrder) {
      continue;
    }
    applyFillSide(buyOrder, fill, TradeDirection.buy);
    applyFillSide(sellOrder, fill, TradeDirection.sell);
  }
}
function applyFillSide(
  order: OrderRecord,
  fill: Fill,
  tradeDir: TradeDirection,
): void {
  const balance = getOrCreateBalance(order.userId);
  const existing = getPosition(order.userId, fill.symbol);
  const marginForFill = (fill.price * fill.qty) / order.leverage;

  if (!existing) {
    openPositon(order, fill, tradeDir, marginForFill, balance);
    return;
  }
  if (existing.side === tradeDir) {
    // growPosition(existing,fill,marginForFill,balance)
    return;
  }
  if (fill.qty < existing.qty) {
    // reducePosition(existing,fill,balance)
    return;
  }
  if (fill.qty === existing.qty) {
    // closePosition(order.userId,existing,fill,balance);
  }
}
function openPositon(
  order: OrderRecord,
  fill: Fill,
  side: TradeDirection,
  marginReserved: number,
  balance: Balance,
): void {
  const positions = getOrCreateUserPosition(order.userId);
  positions.set(order.symbol, {
    userId: order.userId,
    symbol: fill.symbol,
    side,
    qty: fill.qty,
    entryPrice: fill.price,
    leverage: order.leverage,
    marginReserved,
    realizedPnl: 0,
    openedAt: fill.createdAt,
    updatedAt: fill.createdAt,
  });
  balance.locked -= marginReserved;
}
