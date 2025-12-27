import { OneBot } from "~/lib/clients/onebot";
import type { GroupId, UserId } from "~/lib/clients/onebot/models";
import { buildAuthRequestTemplate, buildSimpleNotificationtemplate } from "~/lib/modules/notify/templates";

export interface NotifyService {
  sendAuthRequestMessage(userId: UserId, code: string): Promise<void>;
  sendSimpleNotificationMessage(groupId: GroupId, avatarUrl: string, text: string): Promise<void>;
}

export const NotifyService: NotifyService = {
  async sendAuthRequestMessage(userId, code) {
    const message = buildAuthRequestTemplate({ code });
    await OneBot.sendPrivateMessage(userId, message);
  },
  async sendSimpleNotificationMessage(groupId, avatarUrl, text) {
    const message = buildSimpleNotificationtemplate({ avatarUrl, message: text });
    await OneBot.sendGroupMessage(groupId, message);
  },
};
