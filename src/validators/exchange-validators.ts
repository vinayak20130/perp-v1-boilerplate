import { z } from "zod";

export const creditMoneyRequestDTO = z.object({
  amount: z.number().gt(0),
});

export const withrawMoneyRequestDTO = z.object({ amount: z.number().gt(0) });

export const createOrderDTO = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("limit"),
      direction: z.enum(["buy", "sell"]),
      sym: z.string().trim().min(1),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    }),
    z.object({
      type: z.literal("market"),
      direction: z.enum(["buy", "sell"]),
      sym: z.string().trim().min(1),
      price: z.null().optional(),
      quantity: z.number().int().positive(),
    }),
  ]);