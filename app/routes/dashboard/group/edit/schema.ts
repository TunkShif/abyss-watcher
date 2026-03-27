import * as v from "valibot";

// Lookup: just steamId
export const LookupSchema = v.object({
  intent: v.literal("lookup"),
  steamId: v.pipe(v.string(), v.nonEmpty("Steam ID is required")),
});

// Bind: userId + steamId
export const BindSchema = v.object({
  intent: v.literal("bind"),
  userId: v.pipe(v.string(), v.nonEmpty("User is required")),
  steamId: v.pipe(v.string(), v.nonEmpty("Steam ID is required")),
});

// Unbind: userId + groupId (removes user from this group's tracking context)
export const UnbindSchema = v.object({
  intent: v.literal("unbind"),
  userId: v.pipe(v.string(), v.nonEmpty("User is required")),
  groupId: v.pipe(v.string(), v.nonEmpty("Group is required")),
});

// Discriminated union for all intents
export const ActionSchema = v.variant("intent", [LookupSchema, BindSchema, UnbindSchema]);

export type LookupInput = v.InferOutput<typeof LookupSchema>;
export type BindInput = v.InferOutput<typeof BindSchema>;
export type UnbindInput = v.InferOutput<typeof UnbindSchema>;
export type ActionInput = v.InferOutput<typeof ActionSchema>;
