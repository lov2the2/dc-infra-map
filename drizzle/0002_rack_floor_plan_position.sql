ALTER TABLE "racks" ADD COLUMN IF NOT EXISTS "pos_x" integer;
ALTER TABLE "racks" ADD COLUMN IF NOT EXISTS "pos_y" integer;
ALTER TABLE "racks" ADD COLUMN IF NOT EXISTS "rotation" integer DEFAULT 0;
