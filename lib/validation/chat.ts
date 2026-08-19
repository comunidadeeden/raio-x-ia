import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1).max(12_000),
});

export const chatRequestSchema = z.object({
  id: z.uuid(),
  message: z.object({
    id: z.string().trim().min(1).max(200),
    role: z.literal("user"),
    parts: z.array(textPartSchema).min(1).max(20),
  }),
});
