import type { OneBotClient } from "~/lib/clients/onebot";
import type { GroupId, UserId } from "~/lib/clients/onebot/models";
import type { Logger } from "~/lib/logger";
import { buildAuthRequestTemplate, buildSimpleNotificationtemplate } from "~/lib/modules/notify/templates";

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

  async sendSimpleNotificationMessage(groupId: GroupId, avatarUrl: string, text: string) {
    this.#logger.info({ groupId, text }, "sending simple notification message");
    const message = buildSimpleNotificationtemplate({ avatarUrl, text });
    await this.#bot.sendGroupMessage(groupId, message);
  }
}
