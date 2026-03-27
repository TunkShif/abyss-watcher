import { eq, inArray, and } from "drizzle-orm";
import { groupBy, mapValues } from "es-toolkit";
import { OneBot } from "~/lib/clients/onebot";
import type { Group, GroupId, GroupMemberInfo, UserId } from "~/lib/clients/onebot/models";
import { db } from "~/lib/database";
import { groupsUsers, playersUsers } from "~/lib/database/schema";
import { createLogger } from "~/lib/logging";
import { PlayerService } from "~/lib/modules/player";
import type { BoundUser } from "~/lib/modules/group/models";

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
  listBoundUsersForGroup(groupId: GroupId): Promise<BoundUser[]>;
  unbindPlayerFromGroup(userId: UserId, groupId: GroupId): Promise<void>;
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
  async listBoundUsersForGroup(groupId: GroupId): Promise<BoundUser[]> {
    const [members, boundRecords] = await Promise.all([
      this.listMembers(groupId),
      db
        .select({
          userId: playersUsers.userId,
          playerId: playersUsers.playerId,
        })
        .from(groupsUsers)
        .innerJoin(playersUsers, eq(groupsUsers.userId, playersUsers.userId))
        .where(eq(groupsUsers.groupId, groupId.toString()))
        .all(),
    ]);

    const memberMap = new Map(members.map((m) => [m.user_id.toString(), m]));

    // Fetch steam summaries for bound players
    const playerIds = boundRecords.map((r) => r.playerId);
    const summaries = playerIds.length > 0
      ? await PlayerService.fetchLatestSummaries(playerIds)
      : [];
    const summaryMap = new Map(summaries.map((s) => [s.playerId, s]));

    return boundRecords.map((r) => {
      const member = memberMap.get(r.userId);
      const summary = summaryMap.get(r.playerId);
      return {
        userId: r.userId,
        playerId: r.playerId,
        userName: summary?.name ?? member?.nickname ?? "Unknown",
        avatarUrl: summary?.avatarUrl,
      };
    });
  },

  async unbindPlayerFromGroup(userId: UserId, groupId: GroupId): Promise<void> {
    // Remove user from group's tracking: delete from groups_users only.
    // The global Steam binding in players_users is preserved so the user
    // can still be tracked if added to another group.
    await db.delete(groupsUsers).where(and(
      eq(groupsUsers.userId, userId.toString()),
      eq(groupsUsers.groupId, groupId.toString()),
    ));
  },
};
