import type { OneBotClient } from "~/lib/clients/onebot";
import type { User, UserId } from "~/lib/clients/onebot/models";
import type { Logger } from "~/lib/logger";
import { cached, days } from "~/lib/utils/cache";

export class UserService {
  #bot: OneBotClient;
  #kv: KVNamespace;
  #logger: Logger;

  constructor(kv: KVNamespace, bot: OneBotClient, logger: Logger) {
    this.#bot = bot;
    this.#kv = kv;
    this.#logger = logger.child({ module: "service.user" });
  }

  async list(noCache = false): Promise<User[]> {
    return cached(() => this.#bot.getFriendList(), {
      kv: this.#kv,
      key: "users",
      expirationTtl: days(1),
      noCache,
    });
  }

  async find(userId: UserId): Promise<User | null> {
    this.#logger.debug({ userId }, "finding user");
    const users = await this.list();
    const user = users.find((it) => it.user_id.toString() === userId.toString()) ?? null;
    if (!user) {
      this.#logger.warn({ userId }, "user not found");
    }
    return user;
  }
}
