import { Account } from "./domain/Account";
import { Market, type MarketInput } from "./domain/Market";
import { Order } from "./domain/Order";
import { Position } from "./domain/Position";
import { OrderType, TradeDirection } from "./domain/types";

const SLIPPAGE = Number(process.env.SLIPPAGE ?? 0.05);

export interface CreateOrderInput {
  userId: string;
  symbol: string;
  side: TradeDirection;
  type: OrderType;
  price: number | null;
  qty: number;
  leverage: number;
}

export class Exchange {
  private accounts = new Map<string, Account>();
  private markets = new Map<string, Market>();
  private positions = new Map<string, Map<string, Position>>();
  private orders = new Map<string, Order>();

  private getAccount(userId: string): Account {
    let acc = this.accounts.get(userId);
    if (!acc) {
      acc = new Account(userId);
      this.accounts.set(userId, acc);
    }
    return acc;
  }

  private getMarket(symbol: string): Market {
    const market = this.markets.get(symbol);
    if (!market) {
      throw new Error("unknown market:" + symbol);
    }
    return market;
  }

  public registerMarket(config: MarketInput): void {
    this.markets.set(config.symbol, new Market(config));
  }

  /**
   * onRamp
   */
  public onRamp(userId: string, amount: number) {
    this.getAccount(userId).onRamp(amount);
  }
  /**
   * offRamp
   */
  public offRamp(userId: string, amount: number) {
    this.getAccount(userId).offRamp(amount);
  }
  /**
   * setMarkPrice
   */
  public setMarkPrice(symbol: string, price: number) {
    this.getMarket(symbol).setMarkPrice(price);
  }

  /**
   * createOrder
   */
  public createOrder(input: CreateOrderInput) {
    const market = this.getMarket(input.symbol);
    const price = this.resolvePrice(market, input);

    if (!market.validateLot(input.qty)) {
      throw new Error("quantity is not correct");
    }
    if (!market.validateTick(price)) {
      throw new Error("tick is not correct");
    }
    if (!market.validateLeverage(input.leverage)) {
      throw new Error("leverage out of range");
    }

    const requiredMargin = (input.qty * price) / input.leverage;
    this.getAccount(input.userId).lock(requiredMargin);
    const order = new Order({
      userId: input.userId,
      side: input.side,
      type: input.type,
      symbol: input.symbol,
      price,
      qty: input.qty,
      leverage: input.leverage,
    });
    this.orders.set(order.orderId, order);
    const fills = market.book.match(order)
    for (const fill of fills) {
      const makerOrderId = fill.buyOrderId === order.orderId ?
      fill.sellOrderId : fill.buyOrderId;
      const maker = this.orders.get(makerOrderId)!

      this.applyFillToUser(order.userId, order.symbol, order.side, fill.qty, fill.price, order.leverage)
      this.applyFillToUser(maker.userId, maker.symbol, maker.side, fill.qty, fill.price, maker.leverage)
    }
   
    return {order,fills};
  }

  private resolvePrice(market: Market, input: CreateOrderInput): number {
    if (input.type === OrderType.limit) {
      if (input.price === null) {
        throw new Error("limit order requires a price");
      }
      return input.price;
    }
    const raw =
      input.side === TradeDirection.buy
        ? market.markPrice * (1 + SLIPPAGE)
        : market.markPrice * (1 - SLIPPAGE);
    return Math.round(raw / market.tickSize) * market.tickSize;
  }

  private applyFillToUser(
    userId: string,
    symbol: string,
    fillSide: TradeDirection,
    qty: number,
    price: number,
    leverage: number,
  ): void {
    const existing = this.positions.get(userId)?.get(symbol);

    // case 1 - no position -> open

    if (!existing) {
      const margin = (qty * price) / leverage;
      this.openPosition(userId, symbol, fillSide, qty, price, leverage, margin);
      return;
    }

    // case 2- same side -> grow
    if (existing.side === fillSide) {
      const addedmargin = (qty * price) / leverage;
      existing.grow(qty, price, addedmargin);
      return;
    }

    // case 3 - opposite side , fits within size -> reduce
    if (qty <= existing.size) {
      const { realizedPnL, releasedMargin } = existing.reduce(qty, price);
      const account = this.getAccount(userId);
      account.unlock(releasedMargin);
      if (realizedPnL > 0) {
        account.onRamp(realizedPnL);
      } else if (realizedPnL < 0) {
  account.offRamp(-realizedPnL);
}
      if (existing.size === 0) {
        this.deletePosition(userId, symbol);
        return;
      }
    }
  }

  private openPosition(
    userId: string,
    symbol: string,
    side: TradeDirection,
    size: number,
    entryPrice: number,
    leverage: number,
    marginReserved: number,
  ): void {
    let bySymbol = this.positions.get(userId);
    if (!bySymbol) {
      bySymbol = new Map();
      this.positions.set(userId, bySymbol);
    }
     bySymbol.set(symbol, new Position({
    userId, symbol, side, size, entryPrice, leverage, marginReserved,
  }));

  }
  private deletePosition(userId: string, symbol: string): void {
    const bySymbol = this.positions.get(userId);
    if (!bySymbol) {
      return;
    }
    bySymbol.delete(symbol);
    if (bySymbol.size === 0) {
      this.positions.delete(userId);
    }
  }
}
