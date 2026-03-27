import type { GroupId, UserId } from "~/lib/clients/onebot/models";

export interface BoundUser {
  userId: UserId;
  playerId: string;
  userName: string;
  avatarUrl?: string;
}

export interface GroupWithBoundUsers {
  groupId: GroupId;
  groupName: string;
  memberCount: number;
  boundUsers: BoundUser[];
}
