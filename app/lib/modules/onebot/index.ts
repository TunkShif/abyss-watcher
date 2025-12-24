import { up } from "up-fetch";
import type { AnyMessage } from "~/lib/modules/onebot/message";
import {
  GetFriendListResponseSchema,
  GetGroupListResponseSchema,
  GetGroupMemberInfoResponseSchema,
  GetGroupMemberListResponseSchema,
  type Group,
  type GroupMemberInfo,
  SendPrivateMessageResponseSchema,
  type User,
  type UserId,
} from "~/lib/modules/onebot/models";

export interface OneBotClient {
  getGroupList(nextToken?: string): Promise<Group[]>;
  getFriendList(noCache?: boolean): Promise<User[]>;
  getGroupMemberList(groupId: string | number, noCache?: boolean): Promise<GroupMemberInfo[]>;
  getGroupMemberInfo(groupId: string | number, userId: UserId, noCache?: boolean): Promise<GroupMemberInfo | null>;
  sendPrivateMessage(userId: UserId, message: AnyMessage[]): Promise<void>;
}

// TODO: error handling & logging
export const createOneBotClient = (baseUrl: string, token: string): OneBotClient => {
  const upfetch = up(fetch, () => ({
    baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));

  return {
    async getGroupList(nextToken) {
      const response = await upfetch("/get_group_list", {
        method: "POST",
        body: { next_token: nextToken },
        schema: GetGroupListResponseSchema,
      });
      return response.data ?? [];
    },

    async getFriendList(noCache = false) {
      const response = await upfetch("/get_friend_list", {
        method: "POST",
        body: { no_cache: noCache },
        schema: GetFriendListResponseSchema,
      });
      return response.data ?? [];
    },

    async getGroupMemberList(groupId, noCache = false) {
      const response = await upfetch("/get_group_member_list", {
        method: "POST",
        body: {
          group_id: groupId,
          no_cache: noCache,
        },
        schema: GetGroupMemberListResponseSchema,
      });
      return response.data ?? [];
    },

    async getGroupMemberInfo(groupId, userId, noCache = false) {
      const response = await upfetch("/get_group_member_info", {
        method: "POST",
        body: {
          group_id: groupId,
          user_id: userId,
          no_cache: noCache,
        },
        schema: GetGroupMemberInfoResponseSchema,
      });
      return response.data;
    },

    async sendPrivateMessage(userId, message) {
      await upfetch("/send_private_msg", {
        method: "POST",
        body: {
          user_id: userId,
          message,
        },
        schema: SendPrivateMessageResponseSchema,
      });
    },
  };
};
