import * as v from "valibot";

export const SessionDataSchema = v.object({
  userId: v.string(),
  expiresAt: v.number(),
});

export type SessionData = v.InferOutput<typeof SessionDataSchema>;
