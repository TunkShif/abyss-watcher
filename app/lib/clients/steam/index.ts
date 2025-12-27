import { up } from "up-fetch";
import { env } from "~/lib/env";
import { createLogger } from "~/lib/logging";
import { withLogging } from "~/lib/utils/client";
import {
  type SteamPlayerAchievement,
  SteamPlayerAchievementsResponseSchema,
  type SteamPlayerSummary,
  SteamPlayerSummaryResponseSchema,
} from "./models";

export interface SteamAPIClient {
  /**
   * Returns basic profile information for a list of 64-bit Steam IDs.
   * @param steamIds An array of 64-bit Steam IDs to query.
   * @returns The list of player summaries.
   */
  getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]>;

  /**
   * Returns a list of achievements for this user by app id.
   * @param steamId 64 bit Steam ID to return friend list for.
   * @param appId The ID for the game you're requesting.
   * @param language Optional language. If specified, it will return language data for the requested language.
   * @returns A list of achievements.
   */
  getPlayerAchievements(steamId: string, appId: number, language?: string): Promise<SteamPlayerAchievement[]>;
}

const logger = createLogger("client.steam");

const upfetch = up(fetch, () =>
  withLogging({
    logger,
    baseUrl: "http://api.steampowered.com",
    params: {
      key: env.STEAM_WEBAPI_TOKEN,
    },
  }),
);

export const SteamAPI: SteamAPIClient = {
  async getPlayerSummaries(steamIds: string[]) {
    const data = await upfetch("/ISteamUser/GetPlayerSummaries/v0002/", {
      params: {
        steamids: steamIds.join(","),
      },
      schema: SteamPlayerSummaryResponseSchema,
    });

    return data.response.players;
  },

  async getPlayerAchievements(steamId: string, appId: number, language?: string) {
    const data = await upfetch("/ISteamUserStats/GetPlayerAchievements/v0001/", {
      params: {
        steamid: steamId,
        appid: appId,
        l: language,
      },
      schema: SteamPlayerAchievementsResponseSchema,
    });

    if (!data.playerstats.success) {
      return [];
    }

    return data.playerstats.achievements;
  },
};
