// CRUD de movimientos (antes lib/storage.ts sobre localStorage).
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { movements } from "@/db/schema";
import { requireUserId } from "./auth.server";
import { assertOwnsBusiness } from "./businesses.server";
import { buildDemoMovements, DEMO_BUSINESS_NAME } from "./demo-data";
import type { Movement, MovementType } from "./storage";

export type { Movement, MovementType };

type DbRow = typeof movements.$inferSelect;

/** Normaliza los `null` de columnas SQLite a `undefined`, para calzar con el tipo `Movement` del cliente. */
function normalize(row: DbRow): Movement {
  return {
    id: row.id,
    type: row.type as MovementType,
    concept: row.concept,
    amountNet: row.amountNet,
    hasInvoice: row.hasInvoice,
    category: row.category,
    date: row.date,
    note: row.note ?? undefined,
    providerName: row.providerName ?? undefined,
    invoiceNumber: row.invoiceNumber ?? undefined,
    providerNit: row.providerNit ?? undefined,
  };
}

export const listMovements = createServerFn({ method: "GET" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<Movement[]> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    const rows = await db.select().from(movements).where(eq(movements.businessId, businessId));
    return rows.map(normalize);
  });

export interface MovementInput {
  businessId: string;
  type: MovementType;
  concept: string;
  amountNet: number;
  hasInvoice: boolean;
  category: string;
  date: string;
  note?: string;
  providerName?: string;
  invoiceNumber?: string;
  providerNit?: string;
}

export const addMovement = createServerFn({ method: "POST" })
  .validator((d: MovementInput) => d)
  .handler(async ({ data }): Promise<Movement> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    const row = { id: crypto.randomUUID(), ...data };
    await db.insert(movements).values(row);
    return row;
  });

export const updateMovement = createServerFn({ method: "POST" })
  .validator((d: { id: string; businessId: string } & Partial<MovementInput>) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    const { id, businessId, ...patch } = data;
    await db
      .update(movements)
      .set(patch)
      .where(and(eq(movements.id, id), eq(movements.businessId, businessId)));
    return { ok: true };
  });

export const deleteMovement = createServerFn({ method: "POST" })
  .validator((d: { id: string; businessId: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    await db
      .delete(movements)
      .where(and(eq(movements.id, data.id), eq(movements.businessId, data.businessId)));
    return { ok: true };
  });

export const clearMovements = createServerFn({ method: "POST" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    await db.delete(movements).where(eq(movements.businessId, businessId));
    return { ok: true };
  });

/** Carga el negocio de ejemplo "Dulce Illimani" dentro del emprendimiento indicado. */
export const loadDemoMovements = createServerFn({ method: "POST" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<{ count: number }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    await db.delete(movements).where(eq(movements.businessId, businessId));
    const demo = buildDemoMovements();
    const rows = demo.map((m) => ({ id: crypto.randomUUID(), businessId, ...m }));
    if (rows.length > 0) await db.insert(movements).values(rows);
    return { count: rows.length };
  });

export { DEMO_BUSINESS_NAME };
