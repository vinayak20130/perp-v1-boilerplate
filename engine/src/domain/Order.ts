import { type Fill, OrderStatus, OrderType, TradeDirection } from "./types";

export interface OrderInput {
  userId: string;
  side: TradeDirection;
  type: OrderType;
  symbol: string;
  price: number;
  qty: number;
  leverage: number;
}

export class Order {
  public readonly orderId: string;
  public readonly userId: string;
  public readonly side: TradeDirection;
  public readonly type: OrderType;
  public readonly symbol: string;
  public readonly price: number;
  public readonly qty: number;
  public readonly leverage: number;
  public readonly createdAt: number;

  private _filledQty = 0;
  private _status = OrderStatus.open;
  private _fills: Fill[] = [];
  constructor(input: OrderInput) {
    this.orderId = crypto.randomUUID();
    this.userId = input.userId;
    this.side = input.side;
    this.type = input.type;
    this.symbol = input.symbol;
    this.price = input.price;
    this.qty = input.qty;
    this.leverage = input.leverage;
    this.createdAt = Date.now();
  }
  /**
   * isFilled -> signifies if the order has been completely filled or not
   */
  public get isFilled(): boolean {
    return this._filledQty === this.qty;
  }
  /**
   * remainingQty -> how much qty is remaining for the order to get filled
   */
  public get remainingQty(): number {
    return this.qty - this._filledQty;
  }

  public get status(): OrderStatus {
    return this._status;
  }

  public get fills(): readonly Fill[] {
    return this._fills;
  }
  public fill(qty: number, price: number, counterOrderId: string): Fill {
    if (qty > this.remainingQty) {
      throw new Error("overfill");
    }
    const insertFills = {
      fillId: crypto.randomUUID().toString(),
      symbol: this.symbol,
      price,
      qty,
      buyOrderId:
        this.side === TradeDirection.buy ? this.orderId : counterOrderId,
      sellOrderId:
        this.side === TradeDirection.buy ? counterOrderId : this.orderId,
      createdAt: Date.now(),
    };
    this._filledQty += qty;
    if (this._filledQty === this.qty) {
      this._status = OrderStatus.filled;
    } else {
      this._status = OrderStatus.partially_filled;
    }
    this._fills.push(insertFills);
    return insertFills;
  }
}
