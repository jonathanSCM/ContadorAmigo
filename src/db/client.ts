// Cliente de base de datos. Usa libSQL: un archivo local en desarrollo
// (file:./data/app.db) y, el día que se configure TURSO_DATABASE_URL /
// TURSO_AUTH_TOKEN, el mismo código sirve para una base remota persistente
// en producción — sin cambiar una sola línea, solo variables de entorno.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./data/app.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle(client, { schema });
