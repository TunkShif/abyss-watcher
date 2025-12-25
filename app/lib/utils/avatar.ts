import type { GroupId, UserId } from "~/lib/clients/onebot/models";

export type AvatarType = "user" | "group";

export const avatarUrl = (type: AvatarType, id: UserId | GroupId, size = 640) => {
  if (type === "user") return `https://q1.qlogo.cn/g?b=qq&nk=${id}&s=${size}`;
  if (type === "group") return `https://p.qlogo.cn/gh/${id}/${id}/${size}/`;
};
