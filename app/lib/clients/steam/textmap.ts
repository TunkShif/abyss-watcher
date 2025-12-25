import { SteamPersonaState } from "~/lib/clients/steam/models";

export const SteamPersonaStateTextMap: Record<SteamPersonaState, string> = {
  [SteamPersonaState.Offline]: "离线",
  [SteamPersonaState.Online]: "在线",
  [SteamPersonaState.Busy]: "忙碌",
  [SteamPersonaState.Away]: "离开",
  [SteamPersonaState.Snooze]: "休眠",
  [SteamPersonaState.LookingToTrade]: "交易",
  [SteamPersonaState.LookingToPlay]: "游戏",
};
