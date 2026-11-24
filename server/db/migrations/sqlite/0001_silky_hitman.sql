CREATE TABLE `floor_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`background_file_id` text,
	`background_name` text,
	`aspect_ratio` real DEFAULT 1.4142 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_markers` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`note` text,
	`color` text DEFAULT 'amber' NOT NULL,
	`points` text NOT NULL,
	`room_id` text,
	`task_id` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `plan_markers_floor_idx` ON `plan_markers` (`floor_plan_id`);