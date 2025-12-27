import { up } from "up-fetch";
import type { AnyMessage } from "~/lib/clients/onebot/message";
import {
  GetFriendListResponseSchema,
  GetGroupListResponseSchema,
  GetGroupMemberInfoResponseSchema,
  GetGroupMemberListResponseSchema,
  type Group,
  type GroupId,
  type GroupMemberInfo,
  ResponseSchema,
  type User,
  type UserId,
} from "~/lib/clients/onebot/models";
import { env } from "~/lib/env";
import { createLogger } from "~/lib/logging";
import { withLogging } from "~/lib/utils/client";

export interface OneBotClient {
  getGroupList(nextToken?: string): Promise<Group[]>;
  getFriendList(noCache?: boolean): Promise<User[]>;
  getGroupMemberList(groupId: string | number, noCache?: boolean): Promise<GroupMemberInfo[]>;
  getGroupMemberInfo(groupId: string | number, userId: UserId, noCache?: boolean): Promise<GroupMemberInfo | null>;
  sendPrivateMessage(userId: UserId, message: AnyMessage[]): Promise<void>;
  sendGroupMessage(groupId: GroupId, message: AnyMessage[]): Promise<void>;
}

const logger = createLogger("client.onebot");

const upfetch = up(fetch, () =>
  withLogging({
    logger,
    baseUrl: env.ONEBOT_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.ONEBOT_TOKEN}`,
    },
  }),
);

export const OneBot: OneBotClient = {
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
    logger.info({ userId, message }, "sending private message");
    await upfetch("/send_private_msg", {
      method: "POST",
      body: {
        user_id: userId,
        message,
      },
      schema: ResponseSchema,
    });
  },

  async sendGroupMessage(groupId, message) {
    logger.info({ groupId, message }, "sending group message");
    await upfetch("/send_group_msg", {
      method: "POST",
      body: {
        group_id: groupId,
        message,
      },
      schema: ResponseSchema,
    });
  },
};
