CREATE TABLE `groups_users` (
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `group_id`)
);
--> statement-breakpoint
CREATE TABLE `players_users` (
	`user_id` text NOT NULL,
	`player_id` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `player_id`)
);
