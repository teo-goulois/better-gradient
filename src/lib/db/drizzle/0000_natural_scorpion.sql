CREATE TABLE `api_key_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`request_ip` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_requests_token_hash_unique` ON `api_key_requests` (`token_hash`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`tier` text DEFAULT 'verified' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `created_gradients` (
	`id` text PRIMARY KEY NOT NULL,
	`share` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`shapes_count` integer NOT NULL,
	`colors_count` integer NOT NULL,
	`exported_formats` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `created_gradients_share_unique` ON `created_gradients` (`share`);