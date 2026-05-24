import { FILLS, ORDERBOOKS, OrderStatus, TradeDirection, type Fill, type OrderRecord } from "../Exchange";


export function matchTaker(taker: OrderRecord): Fill[] {
  const fills: Fill[] = [];
  const book = ORDERBOOKS.get(taker.symbol);

  if (!book) {
    return fills;
  }
  const opposite = taker.side === TradeDirection.buy ? book.asks : book.bids;

  //sorting the order book
  const levels = [...opposite.keys()].sort((a, b) =>
    taker.side === TradeDirection.buy ? a - b : b - a,
  );

  // matching
  const crosses = (level: number) =>
    taker.side === TradeDirection.buy
      ? level <= taker.price!
      : level >= taker.price!;

  for (const level of levels) {
    if (!crosses(level)) {
      break;
    }
    const queue = opposite.get(level)!;

    let i = 0;
    while (i < queue.length && taker.filledQty < taker.qty) {
      const maker = queue[i]!;
      // this is for preventing self trade
      if (maker.userId === taker.userId) {
        i++;
        continue;
      }
      const quantityToBeFilled = Math.min(
        maker.qty - maker.filledQty,
        taker.qty - taker.filledQty,
      );
      const fill: Fill = {
        fillId: crypto.randomUUID(),
        symbol: taker.symbol,
        price: level,
        qty: quantityToBeFilled,
        buyOrderId:
          taker.side === TradeDirection.buy ? taker.orderId : maker.orderId,
        sellOrderId:
          taker.side === TradeDirection.buy ? maker.orderId : taker.orderId,
        createdAt: Date.now(),
      };
      FILLS.push(fill);
      fills.push(fill);

      taker.filledQty += quantityToBeFilled;
      maker.filledQty += quantityToBeFilled;

      if (maker.filledQty === maker.qty) {
        maker.status = OrderStatus.filled;
        queue.splice(i, 1);
      } else {
        maker.status = OrderStatus.partially_filled;
        i++;
      }
    }

    if (queue.length === 0) opposite.delete(level);
    if (taker.filledQty === taker.qty) break;
  }
  if (taker.filledQty === taker.qty) {
    taker.status = OrderStatus.filled;
  } else if (taker.filledQty > 0) {
    taker.status = OrderStatus.partially_filled;
  }
  return fills;
}
