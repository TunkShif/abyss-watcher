import { eq } from "drizzle-orm";
import { OneBot } from "~/lib/clients/onebot";
import type { Group, GroupId, GroupMemberInfo } from "~/lib/clients/onebot/models";
import { db } from "~/lib/database";
import { groupsUsers, playersUsers } from "~/lib/database/schema";
import { createLogger } from "~/lib/logging";
import type { BoundUser, GroupWithBoundUsers } from "./models";

export interface GroupService {
  /**
   * Lists all groups the bot is in, with caching.
   *
   * @returns A promise that resolves to an array of groups.
   */
  listGroups(): Promise<Group[]>;

  /**
   * Lists all members of a specific group, with caching.
   *
   * @param groupId - The ID of the group to list members for.
   * @returns A promise that resolves to an array of group members.
   */
  listMembers(groupId: GroupId): Promise<GroupMemberInfo[]>;
  /**
   * Lists all groups with users who have bound Steam player IDs.
   *
   * This method performs the following steps:
   * 1. Fetches all groups from the bot client
   * 2. Queries the database for users who are registered in groups and have bound Steam IDs
   * 3. Groups users by their group ID
   * 4. For each group with bound users, fetches member info and constructs the result
   *
   * Only groups with at least one valid bound user (user exists in group members) are returned.
   *
   * @returns A promise that resolves to an array of groups with their bound users and details.
   */
  listGroupsWithBoundPlayers(): Promise<GroupWithBoundUsers[]>;
}

const logger = createLogger("service.group");

export const GroupService: GroupService = {
  async listGroups(): Promise<Group[]> {
    return OneBot.getGroupList();
  },
  async listMembers(groupId: GroupId): Promise<GroupMemberInfo[]> {
    return OneBot.getGroupMemberList(groupId);
  },
  async listGroupsWithBoundPlayers(): Promise<GroupWithBoundUsers[]> {
    logger.debug("listing groups with bound players");

    // 1. List all groups from bot client
    const groups = await this.listGroups();
    logger.debug({ groupCount: groups.length }, "fetched groups from bot client");

    // 2. Find users that have groupsUsers relation with bound steam IDs
    const boundUsers = await db
      .select({
        userId: groupsUsers.userId,
        groupId: groupsUsers.groupId,
        playerId: playersUsers.playerId,
      })
      .from(groupsUsers)
      .innerJoin(playersUsers, eq(groupsUsers.userId, playersUsers.userId))
      .all();

    logger.debug({ boundUserCount: boundUsers.length }, "fetched bound users from database");

    // FIXME: should return group with empty users
    if (boundUsers.length === 0) {
      logger.info("no bound users found, returning empty result");
      return [];
    }

    // 3. Group users by groupId
    const usersByGroup = new Map<string, typeof boundUsers>();
    for (const user of boundUsers) {
      const groupId = user.groupId;
      if (!usersByGroup.has(groupId)) {
        usersByGroup.set(groupId, []);
      }
      usersByGroup.get(groupId)!.push(user);
    }

    // 4. Build result for each group with bound users
    const result: GroupWithBoundUsers[] = [];

    for (const group of groups) {
      const groupId = group.group_id.toString();
      const groupUsers = usersByGroup.get(groupId);

      if (!groupUsers) continue;

      logger.debug({ groupId, groupName: group.group_name, userCount: groupUsers.length }, "processing group");

      // Get member info to retrieve user names
      const members = await this.listMembers(group.group_id);
      const memberMap = new Map(members.map((m) => [m.user_id.toString(), m]));

      const users: BoundUser[] = [];
      for (const user of groupUsers) {
        const memberInfo = memberMap.get(user.userId);
        if (memberInfo) {
          users.push({
            userId: user.userId,
            playerId: user.playerId,
            userName: memberInfo.card || memberInfo.nickname,
          });
        }
      }

      if (users.length > 0) {
        result.push({
          groupId: group.group_id,
          groupName: group.group_name,
          memberCount: group.member_count,
          boundUsers: users,
        });
        logger.info(
          { groupId, groupName: group.group_name, boundUserCount: users.length },
          "added group with bound users",
        );
      } else {
        logger.warn({ groupId, groupName: group.group_name }, "group has no valid bound users after filtering");
      }
    }

    logger.info({ resultCount: result.length }, "completed listing groups with bound players");
    return result;
  },
};
