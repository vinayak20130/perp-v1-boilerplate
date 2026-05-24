  import {
    MARK_PRICES,
    POSITIONS,
    TradeDirection,
    type Position,
  } from "../utils/store";

const MAINTENANCE_MARGIN_RATE = 0.005;
const CHECK_INTERVAL_MS = 500;
const LIQUIDATOR_USER_ID = 'LIQUIDATION'

  const TO_BINANCE: Record<string, string> = {
    "SOL-PERP": "solusdt",
    "ETH-PERP": "ethusdt",
  };
  const FROM_BINANCE: Record<string, string> = {
    "SOLUSDT": "SOL-PERP",
    "ETHUSDT": "ETH-PERP",
  };

export function startBinanceFeed(symbols: string[]): void {
    // build the combined-stream URL
    const streams = symbols
    .map(s => `${TO_BINANCE[s]}@markPrice@1s`)
    .join("/")
    // map each symbol via TO_BINANCE, suffix "@markPrice@1s", join with "/"
    const url = `wss://fstream.binance.com/market/stream?streams=${streams}`;

    const ws = new WebSocket(url);

    ws.onopen  = () => console.log("[binance] connected", url);
    ws.onclose = (e) => console.warn("[binance] closed", e.code, e.reason);
    ws.onerror = (e) => console.error("[binance] error", e);
    console.log(streams);
    
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string);
      const data = msg.data;
      if (!data ) return;
      // console.log(data);
      const internal = FROM_BINANCE[data.s];
      if (!internal) {
        return
      }
      MARK_PRICES.set(internal,Number(data.p))
      console.log(data.s, "→", data.p);
    };
  }


 function isLiquidatable(position: Position,markPrice: number): boolean {
  const longPnL = (markPrice - position.entryPrice) * position.qty;
  const shortPnL = (position.entryPrice-markPrice) * position.qty;
  const unrealizedPnL = position.side === TradeDirection.buy ? longPnL:shortPnL;
  const equity = position.marginReserved + unrealizedPnL;
  const maintenanceRequirement = markPrice * position.qty * MAINTENANCE_MARGIN_RATE;
  
  return equity <= maintenanceRequirement;
}

  function runLiquidationCheck(): void{
    for (const [userId, positinSymbol] of POSITIONS) {
      for (const [symbol,position] of positinSymbol) {
        const mark = MARK_PRICES.get(symbol);
        if(mark === undefined) continue;
        if(isLiquidatable(position,mark)){
          console.log(`liquidating position ${userId}, ${symbol} at price ${mark}`)
          // liquidatePosition(userId, position);
        }
      }
    }
  }