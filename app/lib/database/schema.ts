import { sql } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersUsers = sqliteTable(
  "players_users",
  {
    userId: text("user_id").notNull(),
    playerId: text("player_id").notNull(),
    createdAt: text().notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.playerId] })],
);

export type PlayersUsers = typeof playersUsers.$inferSelect;
export type InsertPlayersUsersParams = typeof playersUsers.$inferInsert;

export const groupsUsers = sqliteTable(
  "groups_users",
  {
    userId: text("user_id").notNull(),
    groupId: text("group_id").notNull(),
    createdAt: text().notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.groupId] })],
);

export type GroupsUsers = typeof groupsUsers.$inferSelect;
export type InsertGroupsUsersParams = typeof groupsUsers.$inferInsert;
