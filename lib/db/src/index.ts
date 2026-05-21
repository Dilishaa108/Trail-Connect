import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let poolInstance: pg.Pool | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  poolInstance ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return poolInstance;
}

function getDb() {
  dbInstance ??= drizzle(getPool(), { schema });
  return dbInstance;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return Reflect.get(getPool(), prop);
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export * from "./schema";
