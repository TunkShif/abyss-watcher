import type { Logger } from "~/lib/logger";
import { buildAuthRequestTemplate } from "~/lib/modules/notify/templates";
import type { OneBotClient } from "~/lib/modules/onebot";
import type { UserId } from "~/lib/modules/onebot/models";

export class NotifyService {
  #bot: OneBotClient;
  #logger: Logger;

  constructor(bot: OneBotClient, logger: Logger) {
    this.#bot = bot;
    this.#logger = logger.child({ module: "service.notify" });
  }

  async sendAuthRequestMessage(userId: UserId, code: string) {
    this.#logger.info({ userId }, "sending auth request message");
    const message = buildAuthRequestTemplate({ code });
    await this.#bot.sendPrivateMessage(userId, message);
  }
}
