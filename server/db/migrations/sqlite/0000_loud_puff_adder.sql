CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`drive_file_id` text NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer,
	`web_view_link` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `attachments_entity_idx` ON `attachments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_entity_file_uq` ON `attachments` (`entity_type`,`entity_id`,`drive_file_id`);--> statement-breakpoint
CREATE INDEX `attachments_file_idx` ON `attachments` (`drive_file_id`);--> statement-breakpoint
CREATE TABLE `budget_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`room_id` text,
	`label` text NOT NULL,
	`planned_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'stone' NOT NULL,
	`icon` text DEFAULT 'i-lucide-hammer' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`trade` text,
	`email` text,
	`phone` text,
	`vat_number` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `drive_connection` (
	`id` text PRIMARY KEY DEFAULT 'main' NOT NULL,
	`google_email` text NOT NULL,
	`encrypted_refresh_token` text NOT NULL,
	`access_token` text,
	`access_token_expires_at` integer,
	`root_folder_id` text,
	`root_folder_name` text,
	`connected_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`connected_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`contact_id` text,
	`quote_id` text,
	`category_id` text,
	`room_id` text,
	`amount_excl_cents` integer DEFAULT 0 NOT NULL,
	`vat_rate` integer DEFAULT 6 NOT NULL,
	`amount_incl_cents` integer DEFAULT 0 NOT NULL,
	`invoice_number` text,
	`invoice_date` text,
	`due_date` text,
	`paid_on` text,
	`payment_method` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `expenses_category_idx` ON `expenses` (`category_id`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'external' NOT NULL,
	`contact_id` text,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_by` text,
	`used_at` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_hash_unique` ON `invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `phases` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`is_milestone` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY DEFAULT 'main' NOT NULL,
	`name` text DEFAULT 'Verbouwing' NOT NULL,
	`address` text,
	`start_date` text,
	`target_end_date` text,
	`contingency_percent` integer DEFAULT 10 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`contact_id` text,
	`category_id` text,
	`amount_excl_cents` integer DEFAULT 0 NOT NULL,
	`vat_rate` integer DEFAULT 6 NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`received_on` text,
	`valid_until` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`floor` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subsidies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` text,
	`expected_cents` integer DEFAULT 0 NOT NULL,
	`received_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`deadline` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`user_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `task_comments_task_idx` ON `task_comments` (`task_id`);--> statement-breakpoint
CREATE TABLE `task_dependencies` (
	`task_id` text NOT NULL,
	`depends_on_task_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `depends_on_task_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depends_on_task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`room_id` text,
	`category_id` text,
	`phase_id` text,
	`assignee_user_id` text,
	`assignee_contact_id` text,
	`start_date` text,
	`due_date` text,
	`done_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `tasks_assignee_contact_idx` ON `tasks` (`assignee_contact_id`);--> statement-breakpoint
CREATE INDEX `tasks_phase_idx` ON `tasks` (`phase_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`contact_id` text,
	`password_changed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);