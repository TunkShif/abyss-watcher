import PQueue from "p-queue";
import { OneBot } from "~/lib/clients/onebot";
import { image, text } from "~/lib/clients/onebot/message";
import type { UserId } from "~/lib/clients/onebot/models";
import { createLogger } from "~/lib/logging";
import { toSegmentedFormat } from "~/lib/modules/auth/verification";
import type { SendActivityMessageTask } from "~/lib/modules/notify/models";
import { Renderer } from "~/lib/modules/render";

export interface NotifyService {
  sendAuthRequestMessage(userId: UserId, code: string): Promise<void>;
  addSendActivityMessageTask(task: SendActivityMessageTask): Promise<void>;
}

const logger = createLogger("queue.notify");

const queue = new PQueue({ concurrency: 5 });

queue.on("error", (err) => {
  logger.error({ err }, "notify task failed with error");
});

export const NotifyService: NotifyService = {
  async sendAuthRequestMessage(userId, code) {
    const message = [
      text(
        `This is your verification code for Abyss Watcher: ${toSegmentedFormat(code)}, please use it within 2 minute.`,
      ),
    ];
    await OneBot.sendPrivateMessage(userId, message);
  },
  async addSendActivityMessageTask({ user, game, avatar, groupId }) {
    return queue.add(async () => {
      const cardUrl = await Renderer.renderGameCard({
        user,
        game,
        avatar,
      });
      const message = [text(`${user} 正在玩 ${game}`), image(cardUrl)];
      await OneBot.sendGroupMessage(groupId, message);
    });
  },
};
