export enum TradeDirection {
    buy = "buy",
    sell = "sell",
  }

  export enum OrderType {
    market = "market",
    limit = "limit",
  }

  export enum OrderStatus {
    open = "open",
    partially_filled = "partially_filled",
    filled = "filled",
    cancelled = "cancelled",
  }

  export interface Fill {
    fillId: string;
    symbol: string;
    price: number;
    qty: number;
    buyOrderId: string;
    sellOrderId: string;
    createdAt: number;
  }