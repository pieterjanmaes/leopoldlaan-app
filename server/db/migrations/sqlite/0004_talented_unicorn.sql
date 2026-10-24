PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_form_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`time_slot` text,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_form_submissions`("id", "first_name", "last_name", "email", "phone", "time_slot", "created_at") SELECT "id", "first_name", "last_name", "email", "phone", "time_slot", "created_at" FROM `form_submissions`;--> statement-breakpoint
DROP TABLE `form_submissions`;--> statement-breakpoint
ALTER TABLE `__new_form_submissions` RENAME TO `form_submissions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password", "name", "role", "created_at") SELECT "id", "email", "password", "name", "role", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);