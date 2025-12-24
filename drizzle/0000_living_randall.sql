CREATE TABLE `groups_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`group_id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`player_id` text PRIMARY KEY NOT NULL
);
