import { Cache } from "~/lib/cache";
import { SteamAPI } from "~/lib/clients/steam";
import { db } from "~/lib/database";
import { createLogger } from "~/lib/logging";
import { type Player, type PlayerSummary, PlayerSummarySchema } from "~/lib/modules/player/models";
import { hours } from "~/lib/utils/duration";

export interface PlayerService {
  list(): Promise<Player[]>;
  fetchLatestSummaries(playerIds: string[]): Promise<PlayerSummary[]>;
  fetchLocalSummaries(playerIds: string[]): Promise<(PlayerSummary | null)[]>;
  storeLocalSummaries(summaries: PlayerSummary[]): Promise<void>;
  bind(userId: string, playerId: string): Promise<void>;
}

const logger = createLogger("service.player");

export const PlayerService: PlayerService = {
  async list() {
    return db.query.playersUsers.findMany({
      columns: {
        userId: true,
        playerId: true,
      },
    });
  },
  async bind(userId: string, playerId: string) {
    await db
      .insert(playersUsers)
      .values({ userId, playerId })
      .onConflictDoNothing();
  },
  // TODO: maybe need to do batch querying when palyer count exceeds 100
  async fetchLatestSummaries(playerIds: string[]) {
    const summaries = await SteamAPI.getPlayerSummaries(playerIds);
    if (summaries.length !== playerIds.length) {
      logger.warn({ playerIds, summaries }, "not all player summaries found");
    }
    const checkedAt = Date.now();
    return summaries.map((s) => ({
      playerId: s.steamid,
      name: s.personaname,
      avatarUrl: s.avatarmedium,
      state: s.personastate,
      gameId: s.gameid,
      gamePlaying: s.gameextrainfo,
      checkedAt,
    }));
  },
  async storeLocalSummaries(summaries) {
    const records = Object.fromEntries(summaries.map((s) => [buildCacheKey(s.playerId), s]));
    return Cache.mset(records, { expire: hours(1) });
  },
  async fetchLocalSummaries(playerIds: string[]) {
    return Cache.mget(playerIds.map(buildCacheKey), { schema: PlayerSummarySchema });
  },
};

const buildCacheKey = (playerId: string) => `player:summary:${playerId}`;
