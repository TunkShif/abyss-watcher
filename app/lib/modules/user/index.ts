import { OneBot } from "~/lib/clients/onebot";
import { type GroupId, GroupMemberRole, type User, type UserId } from "~/lib/clients/onebot/models";
import { createLogger } from "~/lib/logging";

export interface UserService {
  list(): Promise<User[]>;
  find(userId: UserId): Promise<User | null>;
  isGroupAdmin(userId: UserId, groupId: GroupId): Promise<boolean>;
}

const logger = createLogger("service.user");

export const UserService: UserService = {
  async list() {
    return OneBot.getFriendList();
  },
  async find(userId) {
    const users = await UserService.list();
    const user = users.find((u) => u.user_id.toString() === userId.toString()) ?? null;
    if (!user) {
      logger.warn({ userId }, "user not found");
    }
    return user;
  },
  async isGroupAdmin(userId, groupId) {
    try {
      const member = await OneBot.getGroupMemberInfo(groupId, userId);
      return member?.role === GroupMemberRole.Owner || member?.role === GroupMemberRole.Admin;
    } catch (err) {
      logger.warn({ err }, "error when getting user role");
      return false;
    }
  },
};
