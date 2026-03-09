import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit does not load .env.local automatically (Next.js convention)
config({ path: ".env.local" });
config({ path: ".env" }); // fallback

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema/index.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
