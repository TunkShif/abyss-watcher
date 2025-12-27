import * as v from "valibot";

export const SessionTokenSchema = v.object({
  userId: v.string(),
  token: v.string(),
  expiresAt: v.pipe(
    v.union([v.number(), v.string()]),
    v.transform((v) => Number(v)),
  ),
});

export type SessionToken = v.InferOutput<typeof SessionTokenSchema>;
