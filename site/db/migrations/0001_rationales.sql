CREATE TABLE "rationales" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"public_slug" text NOT NULL,
	"project_name" text NOT NULL,
	"title" text NOT NULL,
	"spine_hash" text NOT NULL,
	"content_md" text NOT NULL,
	"content_hash" text NOT NULL,
	"published_by" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rationales_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
ALTER TABLE "rationales" ADD CONSTRAINT "rationales_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rationales" ADD CONSTRAINT "rationales_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rationales_workspace_project_idx" ON "rationales" USING btree ("workspace_id","project_name");