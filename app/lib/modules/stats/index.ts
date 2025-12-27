import { SteamAPI } from "~/lib/clients/steam";
import { createLogger } from "~/lib/logging";
import { GroupService } from "~/lib/modules/group";
import type { GroupStats } from "~/lib/modules/stats/models";

export interface StatsService {
  /**
   * Fetches statistics for all groups with bound users.
   *
   * Retrieves groups with bound Steam player IDs from the GroupService
   * and enriches the data with Steam player summaries from the Steam API.
   *
   * @returns A promise that resolves to group statistics wrapped in a groups array.
   */
  getGroupStats(): Promise<GroupStats[]>;
}

const logger = createLogger("service.stats");

export const StatsService: StatsService = {
  async getGroupStats(): Promise<GroupStats[]> {
    logger.debug("fetching group stats");

    // 1. Get all groups with bound users from GroupService
    const groupsWithBoundUsers = await GroupService.listGroupsWithBoundPlayers();
    logger.debug({ groupCount: groupsWithBoundUsers.length }, "fetched groups with bound users");

    if (groupsWithBoundUsers.length === 0) {
      logger.info("no groups with bound users found");
      return [];
    }

    // 2. Collect all unique player IDs and fetch Steam summaries
    const playerIds = Array.from(
      new Set(groupsWithBoundUsers.flatMap((group) => group.boundUsers.map((user) => user.playerId))),
    );
    logger.debug({ playerIdCount: playerIds.length }, "fetching steam summaries");

    const steamSummaries = await SteamAPI.getPlayerSummaries(playerIds);
    const summaryMap = new Map(steamSummaries.map((summary) => [summary.steamid, summary]));
    logger.debug({ summaryCount: steamSummaries.length }, "fetched steam summaries");

    // 3. Build stats for each group
    const statsGroups = groupsWithBoundUsers
      .map((group) => {
        const boundUsers = group.boundUsers
          .map((user) => {
            const summary = summaryMap.get(user.playerId);
            if (!summary) {
              logger.warn({ userId: user.userId, playerId: user.playerId }, "steam summary not found for user");
              return null;
            }

            return {
              userId: user.userId.toString(),
              userName: user.userName,
              summary,
            };
          })
          .filter((player): player is NonNullable<typeof player> => player !== null);

        if (boundUsers.length === 0) {
          logger.warn({ groupId: group.groupId, groupName: group.groupName }, "no active players after mapping");
          return null;
        }

        logger.info(
          { groupId: group.groupId, groupName: group.groupName, activePlayerCount: boundUsers.length },
          "added group stats",
        );

        return {
          groupId: group.groupId.toString(),
          groupName: group.groupName,
          memberCount: group.memberCount,
          boundUsers: boundUsers,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

    logger.info({ resultCount: statsGroups.length }, "completed fetching group stats");
    return statsGroups;
  },
};
