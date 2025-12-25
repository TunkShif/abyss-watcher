import * as v from "valibot";

export const FormSchema = v.variant("intent", [
  v.object({
    intent: v.literal("request"),
    userId: v.string(),
  }),
  v.object({
    intent: v.literal("verify"),
    userId: v.string(),
    code: v.pipe(v.string(), v.length(14)),
  }),
]);
