CREATE TABLE `groups_users` (
	`user_id` text,
	`group_id` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `group_id`)
);
--> statement-breakpoint
CREATE TABLE `players_users` (
	`user_id` text,
	`player_id` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `player_id`)
);
