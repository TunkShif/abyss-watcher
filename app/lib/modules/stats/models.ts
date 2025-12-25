import type { SteamPlayerSummary } from "~/lib/clients/steam/models";

export interface GroupStats {
  groupId: string;
  groupName: string;
  memberCount: number;
  boundUsers: UserStats[];
}

export interface UserStats {
  userId: string;
  userName: string;
  summary: SteamPlayerSummary;
}
