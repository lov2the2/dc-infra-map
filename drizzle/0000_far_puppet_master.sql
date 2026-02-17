CREATE TYPE "public"."access_status" AS ENUM('checked_in', 'checked_out', 'expired', 'denied');--> statement-breakpoint
CREATE TYPE "public"."access_type" AS ENUM('visit', 'maintenance', 'delivery', 'emergency', 'tour');--> statement-breakpoint
CREATE TYPE "public"."alert_rule_type" AS ENUM('power_threshold', 'warranty_expiry', 'rack_capacity');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."audit_action_type" AS ENUM('login', 'api_call', 'asset_view', 'export');--> statement-breakpoint
CREATE TYPE "public"."cable_status" AS ENUM('connected', 'planned', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."cable_type" AS ENUM('cat5e', 'cat6', 'cat6a', 'fiber-om3', 'fiber-om4', 'fiber-sm', 'dac', 'power', 'console');--> statement-breakpoint
CREATE TYPE "public"."condition_operator" AS ENUM('gt', 'lt', 'gte', 'lte', 'eq');--> statement-breakpoint
CREATE TYPE "public"."device_face" AS ENUM('front', 'rear');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('active', 'planned', 'staged', 'failed', 'decommissioning', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."equipment_movement_status" AS ENUM('pending', 'approved', 'in_progress', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."equipment_movement_type" AS ENUM('install', 'remove', 'relocate', 'rma');--> statement-breakpoint
CREATE TYPE "public"."interface_type" AS ENUM('rj45-1g', 'rj45-10g', 'sfp-1g', 'sfp+-10g', 'sfp28-25g', 'qsfp+-40g', 'qsfp28-100g', 'console', 'power');--> statement-breakpoint
CREATE TYPE "public"."notification_channel_type" AS ENUM('slack_webhook', 'email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."port_side" AS ENUM('front', 'rear');--> statement-breakpoint
CREATE TYPE "public"."power_feed_phase" AS ENUM('single', 'three');--> statement-breakpoint
CREATE TYPE "public"."power_feed_type" AS ENUM('primary', 'redundant');--> statement-breakpoint
CREATE TYPE "public"."power_outlet_type" AS ENUM('iec_c13', 'iec_c19', 'nema_l6_30', 'nema_l6_20');--> statement-breakpoint
CREATE TYPE "public"."power_port_type" AS ENUM('input', 'output');--> statement-breakpoint
CREATE TYPE "public"."rack_type" AS ENUM('server', 'network', 'power', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."site_status" AS ENUM('active', 'planned', 'staging', 'decommissioning', 'retired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'operator', 'viewer', 'tenant_viewer');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"hashed_password" text,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"site_id" text NOT NULL,
	"tenant_id" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name"),
	CONSTRAINT "manufacturers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "racks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location_id" text NOT NULL,
	"tenant_id" text,
	"type" "rack_type" DEFAULT 'server' NOT NULL,
	"u_height" integer DEFAULT 42 NOT NULL,
	"description" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "regions_name_unique" UNIQUE("name"),
	CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "site_status" DEFAULT 'active' NOT NULL,
	"region_id" text,
	"tenant_id" text,
	"facility" text,
	"address" text,
	"latitude" real,
	"longitude" real,
	"description" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_name_unique" UNIQUE("name"),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "device_types" (
	"id" text PRIMARY KEY NOT NULL,
	"manufacturer_id" text NOT NULL,
	"model" text NOT NULL,
	"slug" text NOT NULL,
	"u_height" integer DEFAULT 1 NOT NULL,
	"full_depth" integer DEFAULT 1 NOT NULL,
	"weight" real,
	"power_draw" integer,
	"interface_templates" jsonb,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "device_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"device_type_id" text NOT NULL,
	"rack_id" text,
	"tenant_id" text,
	"status" "device_status" DEFAULT 'active' NOT NULL,
	"face" "device_face" DEFAULT 'front' NOT NULL,
	"position" integer,
	"serial_number" text,
	"asset_tag" text,
	"warranty_expires_at" timestamp with time zone,
	"primary_ip" text,
	"description" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"action_type" "audit_action_type",
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"personnel_name" text NOT NULL,
	"company" text,
	"contact_phone" text,
	"access_type" "access_type" NOT NULL,
	"status" "access_status" DEFAULT 'checked_in' NOT NULL,
	"purpose" text,
	"escort_name" text,
	"badge_number" text,
	"check_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_check_out_at" timestamp with time zone,
	"actual_check_out_at" timestamp with time zone,
	"check_out_note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"rack_id" text,
	"device_id" text,
	"movement_type" "equipment_movement_type" NOT NULL,
	"status" "equipment_movement_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"serial_number" text,
	"asset_tag" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "power_feeds" (
	"id" text PRIMARY KEY NOT NULL,
	"panel_id" text NOT NULL,
	"rack_id" text,
	"name" text NOT NULL,
	"feed_type" "power_feed_type" DEFAULT 'primary' NOT NULL,
	"max_amps" real NOT NULL,
	"rated_kw" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "power_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"port_id" text,
	"panel_id" text NOT NULL,
	"label" text NOT NULL,
	"outlet_type" "power_outlet_type" NOT NULL,
	"max_amps" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "power_panels" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"location" text,
	"rated_capacity_kw" real NOT NULL,
	"voltage_v" integer DEFAULT 220 NOT NULL,
	"phase_type" "power_feed_phase" DEFAULT 'single' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "power_panels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "power_ports" (
	"id" text PRIMARY KEY NOT NULL,
	"feed_id" text NOT NULL,
	"port_number" integer NOT NULL,
	"port_type" "power_port_type" NOT NULL,
	"outlet_type" "power_outlet_type" NOT NULL,
	"is_occupied" boolean DEFAULT false NOT NULL,
	"device_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "power_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"feed_id" text NOT NULL,
	"voltage_v" real NOT NULL,
	"current_a" real NOT NULL,
	"power_kw" real NOT NULL,
	"power_factor" real,
	"energy_kwh" real,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cables" (
	"id" text PRIMARY KEY NOT NULL,
	"cable_type" "cable_type" NOT NULL,
	"status" "cable_status" DEFAULT 'connected' NOT NULL,
	"label" text NOT NULL,
	"length" numeric,
	"color" text,
	"termination_a_type" text NOT NULL,
	"termination_a_id" text NOT NULL,
	"termination_b_type" text NOT NULL,
	"termination_b_id" text NOT NULL,
	"tenant_id" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "console_ports" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"port_type" text NOT NULL,
	"speed" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "front_ports" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"port_type" "port_side" NOT NULL,
	"rear_port_id" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "interfaces" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"interface_type" "interface_type" NOT NULL,
	"speed" integer,
	"mac_address" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rear_ports" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"port_type" "port_side" NOT NULL,
	"positions" integer DEFAULT 1 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_id" text,
	"severity" "alert_severity" NOT NULL,
	"message" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"resource_name" text NOT NULL,
	"threshold_value" numeric,
	"actual_value" numeric,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rule_type" "alert_rule_type" NOT NULL,
	"resource" text NOT NULL,
	"condition_field" text NOT NULL,
	"condition_operator" "condition_operator" NOT NULL,
	"threshold_value" numeric NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"notification_channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"channel_type" "notification_channel_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racks" ADD CONSTRAINT "racks_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racks" ADD CONSTRAINT "racks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_types" ADD CONSTRAINT "device_types_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_rack_id_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_rack_id_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_feeds" ADD CONSTRAINT "power_feeds_panel_id_power_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "public"."power_panels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_feeds" ADD CONSTRAINT "power_feeds_rack_id_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_outlets" ADD CONSTRAINT "power_outlets_port_id_power_ports_id_fk" FOREIGN KEY ("port_id") REFERENCES "public"."power_ports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_outlets" ADD CONSTRAINT "power_outlets_panel_id_power_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "public"."power_panels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_panels" ADD CONSTRAINT "power_panels_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_ports" ADD CONSTRAINT "power_ports_feed_id_power_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."power_feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_ports" ADD CONSTRAINT "power_ports_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_readings" ADD CONSTRAINT "power_readings_feed_id_power_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."power_feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cables" ADD CONSTRAINT "cables_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "console_ports" ADD CONSTRAINT "console_ports_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "front_ports" ADD CONSTRAINT "front_ports_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "front_ports" ADD CONSTRAINT "front_ports_rear_port_id_rear_ports_id_fk" FOREIGN KEY ("rear_port_id") REFERENCES "public"."rear_ports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rear_ports" ADD CONSTRAINT "rear_ports_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_rule_id_alert_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE no action ON UPDATE no action;