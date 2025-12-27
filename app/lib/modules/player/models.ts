import * as v from "valibot";
import { SteamPersonaState } from "~/lib/clients/steam/models";

export interface Player {
  userId: string;
  playerId: string;
}

export const PlayerSummarySchema = v.object({
  playerId: v.string(),
  name: v.string(),
  avatarUrl: v.string(),
  state: v.enum(SteamPersonaState),
  gameId: v.optional(v.string()),
  gamePlaying: v.optional(v.string()),
  checkedAt: v.number(),
});

export interface PlayerSummary extends v.InferOutput<typeof PlayerSummarySchema> {}
