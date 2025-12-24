import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersUsers = sqliteTable("players_users", {
  userId: text("user_id").primaryKey(),
  playerId: text("player_id").primaryKey(),
});

export type PlayersUsers = typeof playersUsers.$inferSelect;
export type InsertPlayersUsersParams = typeof playersUsers.$inferInsert;

export const groupsUsers = sqliteTable("groups_users", {
  userId: text("user_id").primaryKey(),
  groupId: text("group_id").primaryKey(),
  createdAt: text().notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type GroupsUsers = typeof groupsUsers.$inferSelect;
export type InsertGroupsUsersParams = typeof groupsUsers.$inferInsert;
