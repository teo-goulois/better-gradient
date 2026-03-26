CREATE TABLE `user_exported_gradients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`share` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`shapes_count` integer NOT NULL,
	`colors_count` integer NOT NULL,
	`exported_formats` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_exported_gradients_owner_share_unique` ON `user_exported_gradients` (`owner_id`,`share`);--> statement-breakpoint
CREATE INDEX `user_exported_gradients_owner_updated_idx` ON `user_exported_gradients` (`owner_id`,`updated_at`);--> statement-breakpoint
