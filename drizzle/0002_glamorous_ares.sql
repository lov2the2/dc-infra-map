CREATE TABLE "location_floor_cells" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL,
	"name" text,
	"is_unavailable" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "grid_cols" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "grid_rows" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "location_floor_cells" ADD CONSTRAINT "location_floor_cells_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;