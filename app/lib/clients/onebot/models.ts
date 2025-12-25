import * as v from "valibot";

type Id = string | number;
export type UserId = Id;
export type GroupId = Id;

export enum Bool {
  F = 0,
  T = 1,
}

export enum UserSex {
  Male = "male",
  Female = "female",
  Unknown = "unknown",
}

export enum GroupMemberRole {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
}

export const ResponseSchema = v.object({
  status: v.literal("ok"),
  retcode: v.number(),
  message: v.string(),
  wording: v.optional(v.string()),
  echo: v.optional(v.string()),
  stream: v.union([v.literal("stream-action"), v.literal("normal-action")]),
});

export type Response = v.InferOutput<typeof ResponseSchema>;

export const GroupSchema = v.object({
  group_all_shut: v.enum(Bool),
  group_id: v.number(),
  group_name: v.string(),
  member_count: v.number(),
  max_member_count: v.number(),
});

export type Group = v.InferOutput<typeof GroupSchema>;

export const GroupMemberInfoSchema = v.object({
  group_id: v.number(),
  user_id: v.number(),
  nickname: v.string(),
  card: v.string(),
  sex: v.enum(UserSex),
  age: v.number(),
  area: v.string(),
  level: v.union([v.string(), v.number()]),
  qq_level: v.number(),
  join_time: v.number(),
  last_sent_time: v.number(),
  title_expire_time: v.number(),
  unfriendly: v.boolean(),
  card_changeable: v.boolean(),
  is_robot: v.boolean(),
  shut_up_timestamp: v.number(),
  role: v.enum(GroupMemberRole),
  title: v.string(),
  qage: v.optional(v.string()),
});

export type GroupMemberInfo = v.InferOutput<typeof GroupMemberInfoSchema>;

export const UserSchema = v.object({
  user_id: v.number(),
  nickname: v.string(),
  sex: v.enum(UserSex),
});

export type User = v.InferOutput<typeof UserSchema>;

export const GetGroupListResponseSchema = v.object({
  ...ResponseSchema.entries,
  data: v.nullable(v.array(GroupSchema)),
});

export type GetGroupListResponse = v.InferOutput<typeof GetGroupListResponseSchema>;

export const GetFriendListResponseSchema = v.object({
  ...ResponseSchema.entries,
  data: v.nullable(v.array(UserSchema)),
});

export type GetFriendListResponse = v.InferOutput<typeof GetFriendListResponseSchema>;

export const GetGroupMemberListResponseSchema = v.object({
  ...ResponseSchema.entries,
  data: v.nullable(v.array(GroupMemberInfoSchema)),
});

export type GetGroupMemberListResponse = v.InferOutput<typeof GetGroupMemberListResponseSchema>;

export const GetGroupMemberInfoResponseSchema = v.object({
  ...ResponseSchema.entries,
  data: v.nullable(GroupMemberInfoSchema),
});

export type GetGroupMemberInfoResponse = v.InferOutput<typeof GetGroupMemberInfoResponseSchema>;
