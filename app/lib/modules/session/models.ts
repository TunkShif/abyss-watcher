import * as v from "valibot";

export const SessionTokenSchema = v.object({
  userId: v.string(),
  token: v.string(),
  expiresAt: v.number(),
});

export type SessionToken = v.InferOutput<typeof SessionTokenSchema>;
