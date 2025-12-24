import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const createDatabase = (d1: D1Database) => drizzle(d1, { schema });

export type Database = ReturnType<typeof createDatabase>;
