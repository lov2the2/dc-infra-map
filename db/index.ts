import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

function createDb() {
    const client = postgres(connectionString);
    return drizzle(client, { schema });
}

type DbInstance = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db?: DbInstance };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
    globalForDb.db = db;
}
