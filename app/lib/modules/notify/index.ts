import { buildAuthRequestTemplate } from "~/lib/modules/notify/templates";
import type { OneBotClient } from "~/lib/modules/onebot";
import type { UserId } from "~/lib/modules/onebot/models";

export class NotifyService {
  #bot: OneBotClient;

  constructor(bot: OneBotClient) {
    this.#bot = bot;
  }

  async sendAuthRequestMessage(userId: UserId, code: string) {
    const message = buildAuthRequestTemplate({ code });
    await this.#bot.sendPrivateMessage(userId, message);
  }
}
