import * as v from "valibot";

export const SearchParamsSchema = v.object({
  step: v.optional(v.union([v.literal("input"), v.literal("verify")]), "input"),
});
