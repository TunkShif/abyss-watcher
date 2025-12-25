import type { OneBotClient } from "~/lib/clients/onebot";
import type { Group, GroupId, GroupMemberInfo } from "~/lib/clients/onebot/models";
import { cached, days } from "~/lib/utils/cache";

export class GroupService {
  #bot: OneBotClient;
  #kv: KVNamespace;

  constructor(bot: OneBotClient, kv: KVNamespace) {
    this.#bot = bot;
    this.#kv = kv;
  }

  /**
   * Lists all groups the bot is in, with caching.
   *
   * @param noCache - If true, bypasses the cache and fetches fresh data.
   * @returns A promise that resolves to an array of groups.
   */
  async list(noCache = false): Promise<Group[]> {
    return cached(() => this.#bot.getGroupList(), {
      kv: this.#kv,
      key: "groups",
      expirationTtl: days(1),
      noCache,
    });
  }

  /**
   * Lists all members of a specific group, with caching.
   *
   * @param groupId - The ID of the group to list members for.
   * @param noCache - If true, bypasses the cache and fetches fresh data.
   * @returns A promise that resolves to an array of group members.
   */
  async listMembers(groupId: GroupId, noCache = false): Promise<GroupMemberInfo[]> {
    return cached(() => this.#bot.getGroupMemberList(groupId), {
      kv: this.#kv,
      key: `groups:${groupId}:members`,
      expirationTtl: days(3),
      noCache,
    });
  }
}
