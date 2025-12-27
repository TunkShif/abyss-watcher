import PQueue from "p-queue";
import { OneBot } from "~/lib/clients/onebot";
import type { UserId } from "~/lib/clients/onebot/models";
import type { SendActivityMessageTask } from "~/lib/modules/notify/models";
import { buildAuthRequestTemplate } from "~/lib/modules/notify/templates";

export interface NotifyService {
  sendAuthRequestMessage(userId: UserId, code: string): Promise<void>;
  addSendActivityMessageTask(task: SendActivityMessageTask): Promise<void>;
}

const queue = new PQueue({ concurrency: 5 });

export const NotifyService: NotifyService = {
  async sendAuthRequestMessage(userId, code) {
    const message = buildAuthRequestTemplate({ code });
    await OneBot.sendPrivateMessage(userId, message);
  },
  async addSendActivityMessageTask(task) {
    // TODO: to be implemented
  },
};
