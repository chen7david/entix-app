ALTER TABLE "users" DROP CONSTRAINT "users_sub_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_unique";--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "deleted_at" timestamp DEFAULT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_sub_active_unique" ON "users" USING btree ("sub") WHERE "users"."disabled_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_active_unique" ON "users" USING btree ("username") WHERE "users"."disabled_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_userId_roleId_active_unique" ON "user_roles" USING btree ("user_id","role_id") WHERE "user_roles"."deleted_at" IS NULL;