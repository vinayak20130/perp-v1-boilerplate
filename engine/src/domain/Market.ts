import { OrderBook } from "./Orderbook";

export interface MarketInput {
  symbol: string;
  tickSize: number;
  lotSize: number;
  maxLeverage: number;
  markPrice: number;
}

export class Market {
  public readonly symbol: string;
  public readonly tickSize: number;
  public readonly lotSize: number;
  public readonly maxLeverage: number;
  public readonly book: OrderBook;
  private _markPrice: number;
  constructor(config: MarketInput) {
    this.symbol = config.symbol;
    this.tickSize = config.tickSize;
    this.lotSize = config.lotSize;
    this.maxLeverage = config.maxLeverage;
    this.book = new OrderBook(config.symbol);
    this._markPrice = config.markPrice;
  }
  /**
   * validateLot
   */
  public validateLot(qty: number):boolean{
    return qty%this.lotSize ===0;
  }
  /**
   * validateTick
   */
  public validateTick(price: number): boolean {
    return price % this.tickSize ===0;
  }
  public validateLeverage(leverage: number): boolean{
    return leverage>0 && leverage <= this.maxLeverage
  }
  
  public get markPrice() : number {
    return this._markPrice;
  }
  //some logic about not using a setter here
  // something along these lines
//     …has no reason to suspect that line might trip liquidations. They'd skim past it in review. Then a bug shows up — accounts getting liquidated at the wrong time — and
//   they spend an hour debugging because the dangerous line looked harmless.
  public setMarkPrice(price:number) {
    this._markPrice = price;
  }
  
}

