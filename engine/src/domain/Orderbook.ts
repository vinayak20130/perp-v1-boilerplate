import { Order } from "./Order";
import { TradeDirection, type Fill } from "./types";

export class OrderBook {
  private bids = new Map<number, Order[]>();
  private asks = new Map<number, Order[]>();

  constructor(public readonly symbol: string) {}
  public addResting(order: Order) {
    if (order.side === TradeDirection.buy) {
      let ordersAtPrice = this.bids.get(order.price);
      if (!ordersAtPrice) {
        ordersAtPrice = [];
      }
      ordersAtPrice.push(order);
      this.bids.set(order.price, ordersAtPrice);
    } else {
      let ordersAtPrice = this.asks.get(order.price);
      if (!ordersAtPrice) {
        ordersAtPrice = [];
      }
      ordersAtPrice.push(order);
      this.asks.set(order.price, ordersAtPrice);
    }
  }
  public match(order: Order): Fill[] {
    const opposite = order.side === TradeDirection.buy ? this.asks : this.bids;
    const levels = [...opposite.keys()].sort((a, b) =>
      order.side === TradeDirection.buy ? a - b : b - a,
    );
    const crosses = (level: number): boolean => {
     return  order.side === TradeDirection.buy
        ? level <= order.price
        : level >= order.price;
    };
    const fills: Fill[] = [];
   for (const level of levels) {
    if (!crosses(level)) {
      break;
    }
    const queue = opposite.get(level)!;
    let i = 0;
    while (i<queue.length  && order.remainingQty > 0) {
      
        const maker = queue[i]!;
        if (maker?.userId === order.userId) {
            i++;
            continue
        }
        const quantityToBeFilled = Math.min(maker?.remainingQty!,order.remainingQty)
       const fill =  order.fill(quantityToBeFilled,level,maker.orderId)
        maker.fill(quantityToBeFilled,level,order.orderId)
        if (maker.isFilled) {
            queue.splice(i, 1);
        }else {
        i++;
      }
      fills.push(fill)
    }
    if (queue.length === 0) opposite.delete(level);
   }
   return fills
  }
}
