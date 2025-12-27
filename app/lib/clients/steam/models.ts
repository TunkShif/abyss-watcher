import * as v from "valibot";

export enum SteamPersonaState {
  Offline = 0,
  Online = 1,
  Busy = 2,
  Away = 3,
  Snooze = 4,
  LookingToTrade = 5,
  LookingToPlay = 6,
}

export enum SteamCommunityVisibilityState {
  Private = 1,
  Public = 3,
}

export enum SteamProfileState {
  NotConfigured = 0,
  Configured = 1,
}

export enum SteamCommentPermission {
  FriendsOnly = 1,
  Everyone = 2,
}

/**
 * Steam Language Code
 */
export enum SteamLanguageCode {
  ChineseSimplified = "schinese",
}

/**
 * Steam Player Schema
 */
export const SteamPlayerSummarySchema = v.object({
  /** 64bit SteamID of the user */
  steamid: v.string(),
  /** The player's persona name (display name) */
  personaname: v.string(),
  /** The full URL of the player's Steam Community profile. */
  profileurl: v.string(),
  /** The full URL of the player's 32x32px avatar. */
  avatar: v.string(),
  /** The full URL of the player's 64x64px avatar. */
  avatarmedium: v.string(),
  /** The full URL of the player's 184x184px avatar. */
  avatarfull: v.string(),
  /** The MD5 hash of the player's avatar. */
  avatarhash: v.optional(v.string()),
  /** The user's current status. */
  personastate: v.enum(SteamPersonaState),
  /** Privacy state of the profile. */
  communityvisibilitystate: v.enum(SteamCommunityVisibilityState),
  /** If the user has a community profile configured. */
  profilestate: v.optional(v.enum(SteamProfileState)),
  /** The last time the user was online, in unix time. */
  lastlogoff: v.optional(v.number()),
  /** If the profile allows public comments. */
  commentpermission: v.optional(v.enum(SteamCommentPermission)),
  /** The player's "Real Name", if they have set it. */
  realname: v.optional(v.string()),
  /** The player's primary group, as configured in their Steam Community profile. */
  primaryclanid: v.optional(v.string()),
  /** The time the player's account was created. */
  timecreated: v.optional(v.number()),
  /** If the user is currently in-game, this value will be returned and set to the gameid of that game. */
  gameid: v.optional(v.string()),
  /**
   * The ip and port of the game server the user is currently playing on,
   * if they are playing on-line in a game using Steam matchmaking.
   */
  gameserverip: v.optional(v.string()),
  /**
   * If the user is currently in-game, this will be the name of the game they are playing.
   * This may be the name of a non-Steam game shortcut.
   */
  gameextrainfo: v.optional(v.string()),
  /** The user's country of residence, 2-character ISO country code */
  loccountrycode: v.optional(v.string()),
  /** The user's state of residence */
  locstatecode: v.optional(v.string()),
  /** An internal code indicating the user's city of residence. */
  loccityid: v.optional(v.number()),
  /** Legacy city ID */
  cityid: v.optional(v.number()),
  /** Persona state flags */
  personastateflags: v.optional(v.number()),
});

export type SteamPlayerSummary = v.InferOutput<typeof SteamPlayerSummarySchema>;

/**
 * Steam User Summary Response Schema
 */
export const SteamPlayerSummaryResponseSchema = v.object({
  response: v.object({
    players: v.array(SteamPlayerSummarySchema),
  }),
});

export type SteamPlayerSummaryResponse = v.InferOutput<typeof SteamPlayerSummaryResponseSchema>;

/**
 * Steam Player Achievement Schema
 */
export const SteamPlayerAchievementSchema = v.object({
  /** The API name of the achievement */
  apiname: v.string(),
  /** Whether or not the achievement has been completed. */
  achieved: v.number(),
  /** Date when the achievement was unlocked. */
  unlocktime: v.number(),
  /** Localized achievement name */
  name: v.optional(v.string()),
  /** Localized description of the achievement */
  description: v.optional(v.string()),
});

export type SteamPlayerAchievement = v.InferOutput<typeof SteamPlayerAchievementSchema>;

/**
 * Steam Player Achievements Response Schema
 */
export const SteamPlayerAchievementsResponseSchema = v.object({
  playerstats: v.variant("success", [
    v.object({
      success: v.literal(true),
      steamID: v.string(),
      gameName: v.string(),
      achievements: v.array(SteamPlayerAchievementSchema),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    }),
  ]),
});

export type SteamPlayerAchievementsResponse = v.InferOutput<typeof SteamPlayerAchievementsResponseSchema>;

export const SteamPersonaStateTextMap: Record<SteamPersonaState, string> = {
  [SteamPersonaState.Offline]: "离线",
  [SteamPersonaState.Online]: "在线",
  [SteamPersonaState.Busy]: "忙碌",
  [SteamPersonaState.Away]: "离开",
  [SteamPersonaState.Snooze]: "休眠",
  [SteamPersonaState.LookingToTrade]: "交易",
  [SteamPersonaState.LookingToPlay]: "游戏",
};
