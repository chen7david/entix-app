CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"sub" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"disabled_at" timestamp DEFAULT NULL,
	"verified_at" timestamp DEFAULT NULL,
	"deleted_at" timestamp DEFAULT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_sub_unique" UNIQUE("sub"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
