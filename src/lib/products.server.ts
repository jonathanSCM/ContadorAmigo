// CRUD de catálogo de productos (antes lib/products.ts sobre localStorage).
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { requireUserId } from "./auth.server";
import { assertOwnsBusiness } from "./businesses.server";
import { DEMO_PRODUCTS } from "./demo-data";

export interface Product {
  id: string;
  businessId: string;
  name: string;
  cost: number;
  price: number;
}

export const listProducts = createServerFn({ method: "GET" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<Product[]> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    return db.select().from(products).where(eq(products.businessId, businessId));
  });

export const addProduct = createServerFn({ method: "POST" })
  .validator((d: { businessId: string; name: string; cost: number; price: number }) => d)
  .handler(async ({ data }): Promise<Product> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    const row = { id: crypto.randomUUID(), ...data };
    await db.insert(products).values(row);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((d: { id: string; businessId: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);
    await db
      .delete(products)
      .where(and(eq(products.id, data.id), eq(products.businessId, data.businessId)));
    return { ok: true };
  });

export const loadDemoProducts = createServerFn({ method: "POST" })
  .validator((businessId: string) => businessId)
  .handler(async ({ data: businessId }): Promise<{ count: number }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, businessId);
    await db.delete(products).where(eq(products.businessId, businessId));
    const rows = DEMO_PRODUCTS.map((p) => ({ id: crypto.randomUUID(), businessId, ...p }));
    await db.insert(products).values(rows);
    return { count: rows.length };
  });
