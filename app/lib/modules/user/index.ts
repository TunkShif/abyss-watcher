import { OneBot } from "~/lib/clients/onebot";
import type { User, UserId } from "~/lib/clients/onebot/models";
import { createLogger } from "~/lib/logging";

export interface UserService {
  list(): Promise<User[]>;
  find(userId: UserId): Promise<User | null>;
}

const logger = createLogger("service.user");

export const UserService: UserService = {
  async list() {
    return OneBot.getFriendList();
  },
  async find(userId) {
    const users = await UserService.list();
    const user = users.find((it) => it.user_id.toString() === userId.toString()) ?? null;
    if (!user) {
      logger.warn({ userId }, "user not found");
    }
    return user;
  },
};
