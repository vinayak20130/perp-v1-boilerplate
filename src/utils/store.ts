import {
  TradeDirection,
  OrderType,
  OrderStatus,
} from "../../prisma/generated/prisma/enums";

export { TradeDirection, OrderType, OrderStatus };

export interface Balance {
  available: number;
  locked: number;
}

export interface RestingOrder {
  orderId: string;
  userId: string;
  side: TradeDirection;
  type: "limit";
  symbol: string;
  price: number;
  qty: number;
  filledQty: number;
  status: OrderStatus;
  createdAt: number;
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  side: TradeDirection;
  type: OrderType;
  symbol: string;
  price: number | null;
  qty: number;
  filledQty: number;
  status: OrderStatus;
  fills: Fill[];
  createdAt: number;
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

export interface OrderBook {
  bids: Map<number, RestingOrder[]>;
  asks: Map<number, RestingOrder[]>;
}

export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  side: TradeDirection;
  symbol: string;
  price: number | null;
  qty: number;
}

export interface DepthLevel {
  price: number;
  qty: number;
}

export interface DepthResponse {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export function getOrCreateBalance(userId: string): Balance {
  let entry = BALANCES.get(userId);
  if (!entry) {
    entry = {};
    BALANCES.set(userId, entry);
  }
  if (!entry.USD) {
    entry.USD = { available: 0, locked: 0 };
  }
  return entry.USD;
}
 export function getOrCreateBook(sym: string): OrderBook {
    let book = ORDERBOOKS.get(sym);
    if (!book) { book = { bids: new Map(), asks: new Map() }; ORDERBOOKS.set(sym, book); }
    return book;
  }

export const BALANCES = new Map<string, Record<string, Balance>>();
export const ORDERBOOKS = new Map<string, OrderBook>();
export const ORDERS = new Map<string, OrderRecord>();
export const FILLS: Fill[] = [];
