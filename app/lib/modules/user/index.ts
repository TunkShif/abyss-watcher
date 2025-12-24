import type { OneBotClient } from "~/lib/modules/onebot";
import type { User, UserId } from "~/lib/modules/onebot/models";
import { cached, days } from "~/lib/utils/cache";

export class UserService {
  #bot: OneBotClient;
  #kv: KVNamespace;

  constructor(bot: OneBotClient, kv: KVNamespace) {
    this.#bot = bot;
    this.#kv = kv;
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
    const users = await this.list();
    return users.find((it) => it.user_id.toString() === userId.toString()) ?? null;
  }
}
