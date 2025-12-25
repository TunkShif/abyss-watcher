import type { SteamAPIClient } from "~/lib/clients/steam";
import { type Logger, noopLogger } from "~/lib/logger";
import type { GroupService } from "~/lib/modules/group";
import type { GroupStats } from "~/lib/modules/stats/models";

export class StatsService {
  #steam: SteamAPIClient;
  #groupService: GroupService;
  #logger: Logger;

  constructor(steam: SteamAPIClient, groupService: GroupService, logger: Logger = noopLogger) {
    this.#steam = steam;
    this.#groupService = groupService;
    this.#logger = logger.child({ module: "service.stats" });
  }

  /**
   * Fetches statistics for all groups with bound users.
   *
   * Retrieves groups with bound Steam player IDs from the GroupService
   * and enriches the data with Steam player summaries from the Steam API.
   *
   * @returns A promise that resolves to group statistics wrapped in a groups array.
   */
  async getGroupStats(): Promise<GroupStats[]> {
    this.#logger.debug("fetching group stats");

    // 1. Get all groups with bound users from GroupService
    const groupsWithBoundUsers = await this.#groupService.listGroupsWithBoundPlayers();
    this.#logger.debug({ groupCount: groupsWithBoundUsers.length }, "fetched groups with bound users");

    if (groupsWithBoundUsers.length === 0) {
      this.#logger.info("no groups with bound users found");
      return [];
    }

    // 2. Collect all unique player IDs and fetch Steam summaries
    const playerIds = Array.from(
      new Set(groupsWithBoundUsers.flatMap((group) => group.boundUsers.map((user) => user.playerId))),
    );
    this.#logger.debug({ playerIdCount: playerIds.length }, "fetching steam summaries");

    const steamSummaries = await this.#steam.getPlayerSummaries(playerIds);
    const summaryMap = new Map(steamSummaries.map((summary) => [summary.steamid, summary]));
    this.#logger.debug({ summaryCount: steamSummaries.length }, "fetched steam summaries");

    // 3. Build stats for each group
    const statsGroups = groupsWithBoundUsers
      .map((group) => {
        const boundUsers = group.boundUsers
          .map((user) => {
            const summary = summaryMap.get(user.playerId);
            if (!summary) {
              this.#logger.warn({ userId: user.userId, playerId: user.playerId }, "steam summary not found for user");
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
          this.#logger.warn({ groupId: group.groupId, groupName: group.groupName }, "no active players after mapping");
          return null;
        }

        this.#logger.info(
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

    this.#logger.info({ resultCount: statsGroups.length }, "completed fetching group stats");
    return statsGroups;
  }
}
