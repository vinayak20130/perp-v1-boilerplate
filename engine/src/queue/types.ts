export type EngineRequestType =
  | "create_order"
  | "cancel_order"
  | "on_ramp"
  | "off_ramp"
  | "mark_price";

export interface EngineRequest<T = unknown> {
  requestId: string;
  type: EngineRequestType;
  payload: T;
}

export interface EngineResponse {
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}
