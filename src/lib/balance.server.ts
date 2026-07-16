// CRUD de ítems del Balance General (Activos, Pasivos, Capital propio).
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { balanceItems } from "@/db/schema";
import { requireUserId } from "./auth.server";
import { assertOwnsBusiness } from "./businesses.server";
import type { BalanceCategory, BalanceItem } from "./balance";

export type { BalanceItem, BalanceCategory };

export const listBalanceItems = createServerFn({ method: "GET" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<BalanceItem[]> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    const rows = await db.select().from(balanceItems).where(eq(balanceItems.businessId, businessId));
    return rows.map((r) => ({ ...r, category: r.category as BalanceCategory }));
  });

export const addBalanceItem = createServerFn({ method: "POST" })
  .validator((d: { businessId: string; category: BalanceCategory; name: string; amount: number }) => d)
  .handler(async ({ data }): Promise<BalanceItem> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    const row = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    await db.insert(balanceItems).values(row);
    return row;
  });

export const updateBalanceItem = createServerFn({ method: "POST" })
  .validator((d: { id: string; businessId: string; name?: string; amount?: number }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    const { id, businessId, ...patch } = data;
    if (Object.keys(patch).length > 0) {
      await db
        .update(balanceItems)
        .set(patch)
        .where(and(eq(balanceItems.id, id), eq(balanceItems.businessId, businessId)));
    }
    return { ok: true };
  });

export const deleteBalanceItem = createServerFn({ method: "POST" })
  .validator((d: { id: string; businessId: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    await db
      .delete(balanceItems)
      .where(and(eq(balanceItems.id, data.id), eq(balanceItems.businessId, data.businessId)));
    return { ok: true };
  });
