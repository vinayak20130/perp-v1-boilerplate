import { z } from "zod";

export const createOrderDTO = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("limit"),
      direction: z.enum(["buy", "sell"]),
      sym: z.string().trim().min(1),
      price: z.number().positive(),
      leverage: z.number().int().min(1).max(50),
      quantity: z.number().int().positive(),
    }),
    z.object({
      type: z.literal("market"),
      direction: z.enum(["buy", "sell"]),
      sym: z.string().trim().min(1),
      leverage: z.number().int().min(1).max(50),
      price: z.null().optional(),
      quantity: z.number().int().positive(),
    }),
  ]);

export const onRampDTO = z.object({
  amount: z.number().gt(0),
});
export const offRampDTO = z.object({
  amount: z.number().gt(0),
});