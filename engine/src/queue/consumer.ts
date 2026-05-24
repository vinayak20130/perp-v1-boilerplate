import { RedisClient } from "bun";
import type { EngineRequest, EngineResponse } from "./types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const REQUEST_STREAM = process.env.REQUEST_STREAM ?? "orders";
const RESPONSE_STREAM = process.env.RESPONSE_STREAM ?? "engine-events";
const GROUP_NAME = process.env.GROUP_NAME ?? "engine-workers";
const CONSUMER_NAME = process.env.CONSUMER_NAME ?? "worker-1";

const blockingClient = new RedisClient(REDIS_URL);
const client = new RedisClient(REDIS_URL);

function pairsToObject(pairs: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < pairs.length; i += 2) {
    out[pairs[i]!] = pairs[i + 1]!;
  }
  return out;
}

async function publishResponse(response: EngineResponse) {
  await client.send("XADD", [
    RESPONSE_STREAM,
    "*",
    "requestId",
    response.requestId,
    "ok",
    (response.ok ? true : false).toString(),
    "result",
    JSON.stringify(response.result ?? null),
    "error",
    response.error ?? "",
  ]);
}

async function dispatch(req:EngineRequest): Promise <EngineResponse>{
    switch (req.type) {
        case 'create_order':
        case 'cancel_order':
        case 'on_ramp':
        case 'off_ramp':
        return {requestId: req.requestId , ok:true, result: {echoed: req}};   

       
    
        default:
           return {
            requestId: req.requestId,
            ok: false,
            error: `unknkown type ${(req as EngineRequest).type}`
           }
    }
}
async function handleMessage(id: string, fields: Record<string,string>){
    const requestId = fields.requestId ?? id;
    try {
        const req = {
            requestId,
            type: fields.type,
            payload: fields.payload ? JSON.parse(fields.payload) : null,
        } as EngineRequest;
        const response = await dispatch(req)
        await publishResponse(response)
    } catch (error) {
        await publishResponse({
            requestId,
            ok: false,
            error: (error as Error).message
        })
    }
}
function shutdown(signal:string) {
    console.log(`\n ${signal} received, shutting down`)
    blockingClient.close()
    client.close()
    process.exit(0)
}

async function ensureGroup() {
    try {
      await client.send("XGROUP", [
        "CREATE",
        REQUEST_STREAM,
        GROUP_NAME,
        "$",
        "MKSTREAM",
      ]);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (!msg.includes("BUSYGROUP")) throw err;
    }
  }
export async function startConsumer() {
    await ensureGroup()
    console.log(`[${CONSUMER_NAME}] listening on "${REQUEST_STREAM}" (group "${GROUP_NAME}")`)
    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))

    while (true) {
        const reply = ( await blockingClient.send("XREADGROUP", [
            "GROUP",
            GROUP_NAME,
            CONSUMER_NAME,
            "COUNT",
            "10",
            "BLOCK",
            "5000",
            "STREAMS",
            REQUEST_STREAM,
            ">",
        ])) as [string, [string, string []][]][] | null;
        if (!reply) {
            continue;
        }
        for(const [,messages] of reply){
            for (const [id,pairs] of messages) {
                const fields = pairsToObject(pairs);
          await handleMessage(id, fields);
          await client.send("XACK", [REQUEST_STREAM, GROUP_NAME, id]);
        }
      }
    }
}