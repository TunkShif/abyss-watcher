import type { GroupId } from "~/lib/clients/onebot/models";

export interface SendActivityMessageTask {
  groupId: GroupId;
  user: string;
  avatar: string;
  game: string;
}
