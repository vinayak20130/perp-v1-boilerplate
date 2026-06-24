import { TradeDirection } from "./types";

export interface PositionInput {
  userId: string;
  symbol: string;
  side: TradeDirection;
  size: number;
  entryPrice: number;
  leverage: number;
  marginReserved: number;
}

export class Position {
  public readonly userId: string;
  public readonly symbol: string;
  public readonly side: TradeDirection;
  public readonly leverage: number;

  private _size: number;
  private _entryPrice: number;
  private _marginReserved: number;
  private _realizedPnl: number;

  constructor(input: PositionInput) {
    this.userId = input.userId;
    this.symbol = input.symbol;
    this.side = input.side;
    this.leverage = input.leverage;
    this._size = input.size;
    this._entryPrice = input.entryPrice;
    this._marginReserved = input.marginReserved;
    this._realizedPnl = 0;
  }
  /**
   * grow
   */
  public grow(qty: number, price: number, addedMargin: number): void {
    this._entryPrice =
      (this._size * this._entryPrice + qty * price) / (this._size + qty);
    this._size += qty;
    this._marginReserved += addedMargin;
  }
  /**
   * reduce
   */
  public reduce(
    qty: number,
    exitPrice: number,
  ): { realizedPnL: number; releasedMargin: number } {
    if (qty > this._size) {
      throw new Error("cannot reduce more than the open size");
    }
    const realizedPnL = this.pnl(exitPrice, qty);
    const releasedMargin = this._marginReserved * (qty / this._size);
    this._realizedPnl += realizedPnL;
    this._marginReserved -= releasedMargin;
    this._size -= qty;

    return { realizedPnL, releasedMargin };
  }
  /**
   * unrealizedPnL
   */
  public unrealizedPnL(markPrice: number): number {
    return this.pnl(markPrice, this._size);
  }
  private pnl(price: number, qty: number): number {
    return this.side === TradeDirection.buy
      ? (price - this._entryPrice) * qty
      : (this._entryPrice - price) * qty;
  }

  public get size(): number {
    return this._size;
  }

  public get entryPrice(): number {
    return this._entryPrice;
  }

  public get marginReserved(): number {
    return this._marginReserved;
  }

  public get realizedPnL(): number {
    return this._realizedPnl;
  }
}
