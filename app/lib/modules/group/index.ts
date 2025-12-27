import { eq, inArray } from "drizzle-orm";
import { groupBy, mapValues } from "es-toolkit";
import { OneBot } from "~/lib/clients/onebot";
import type { Group, GroupId, GroupMemberInfo } from "~/lib/clients/onebot/models";
import { db } from "~/lib/database";
import { groupsUsers, playersUsers } from "~/lib/database/schema";
import { createLogger } from "~/lib/logging";

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
  listPlayerGroupIds(playerIds: string[]): Promise<Record<string, string[]>>;
}

export const GroupService: GroupService = {
  async listGroups(): Promise<Group[]> {
    return OneBot.getGroupList();
  },
  async listMembers(groupId: GroupId): Promise<GroupMemberInfo[]> {
    return OneBot.getGroupMemberList(groupId);
  },
  async listPlayerGroupIds(playerIds) {
    const result = await db
      .select({
        playerId: playersUsers.playerId,
        groupId: groupsUsers.groupId,
      })
      .from(groupsUsers)
      .innerJoin(playersUsers, eq(groupsUsers.userId, playersUsers.userId))
      .where(inArray(playersUsers.playerId, playerIds))
      .all();
    return mapValues(
      groupBy(result, (r) => r.playerId),
      (rs) => rs.map((r) => r.groupId),
    );
  },
};
