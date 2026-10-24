ALTER TABLE `form_submissions` ADD `time_slot` text;--> statement-breakpoint
ALTER TABLE `form_submissions` DROP COLUMN `tijdstip`;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'admin' NOT NULL;