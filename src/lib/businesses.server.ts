// CRUD de emprendimientos (antes vivía en lib/profiles.ts sobre localStorage).
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses, movements } from "@/db/schema";
import { requireUserId } from "./auth.server";
import type { Sector } from "./sectors";
import type { Movement } from "./storage";
import { calcMonthly, healthStatus, type Health } from "./tax";

// Paleta curada para las tarjetas del dashboard (coherente con la identidad visual).
export const CARD_COLORS = [
  "#B85042", // terracota (marca)
  "#2E6A4E", // verde bosque
  "#35617C", // azul pizarra
  "#B07E22", // ámbar
  "#7A5C99", // ciruela
  "#AF432F", // ladrillo
  "#4A7A6D", // salvia
  "#8F5B3C", // canela
] as const;

export interface BusinessRow {
  id: string;
  name: string;
  sector: Sector | null;
  nit: string | null;
  cardColor: string;
  savingsLabel: string;
  savingsTarget: number;
  emergencyMonths: number;
  createdAt: string;
}

export interface BusinessSummary {
  ingresosMes: number;
  utilidadMes: number;
  health: Health;
  healthLabel: string;
}

export type BusinessRowWithSummary = BusinessRow & { summary: BusinessSummary };

/** Lanza si `businessId` no existe o no pertenece a `userId`. Úsalo en otras server functions. */
export const assertOwnsBusiness = createServerOnlyFn(async (userId: string, businessId: string): Promise<void> => {
  const rows = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId)))
    .limit(1);
  if (rows.length === 0) throw new Error("Emprendimiento no encontrado.");
});

export const listMyBusinesses = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessRow[]> => {
    const userId = await requireUserId();
    const rows = await db.select().from(businesses).where(eq(businesses.userId, userId));
    return rows
      .map((r) => ({ ...r, sector: (r.sector as Sector | null) ?? null }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
);

/** Igual que `listMyBusinesses`, pero con un resumen financiero del mes actual por negocio (para el dashboard). */
export const listMyBusinessesWithSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessRowWithSummary[]> => {
    const userId = await requireUserId();
    const rows = await db.select().from(businesses).where(eq(businesses.userId, userId));
    const bizList = rows
      .map((r) => ({ ...r, sector: (r.sector as Sector | null) ?? null }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const movsByBusiness = new Map<string, Movement[]>();
    if (bizList.length > 0) {
      const rowsMovs = await db
        .select()
        .from(movements)
        .where(
          inArray(
            movements.businessId,
            bizList.map((b) => b.id),
          ),
        );
      for (const m of rowsMovs) {
        const list = movsByBusiness.get(m.businessId) ?? [];
        list.push({
          id: m.id,
          type: m.type as Movement["type"],
          concept: m.concept,
          amountNet: m.amountNet,
          hasInvoice: m.hasInvoice,
          category: m.category,
          date: m.date,
          note: m.note ?? undefined,
          providerName: m.providerName ?? undefined,
          invoiceNumber: m.invoiceNumber ?? undefined,
          providerNit: m.providerNit ?? undefined,
        });
        movsByBusiness.set(m.businessId, list);
      }
    }

    return bizList.map((b) => {
      const monthly = calcMonthly(movsByBusiness.get(b.id) ?? []);
      const h = healthStatus(monthly);
      return {
        ...b,
        summary: {
          ingresosMes: monthly.ingresos,
          utilidadMes: monthly.utilidad,
          health: h.level,
          healthLabel: h.label,
        },
      };
    });
  },
);

export const getMyBusiness = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<BusinessRow | null> => {
    const userId = await requireUserId();
    const rows = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, id), eq(businesses.userId, userId)))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return { ...r, sector: (r.sector as Sector | null) ?? null };
  });

export const createBusiness = createServerFn({ method: "POST" })
  .validator((d: { name: string; sector?: Sector }) => d)
  .handler(async ({ data }): Promise<BusinessRow> => {
    const userId = await requireUserId();
    const name = data.name.trim();
    if (!name) throw new Error("Ponle un nombre a tu emprendimiento.");
    const id = crypto.randomUUID();
    const color = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
    const row = {
      id,
      userId,
      name,
      sector: data.sector ?? null,
      nit: null,
      cardColor: color,
      savingsLabel: "Meta de ahorro",
      savingsTarget: 0,
      emergencyMonths: 3,
      createdAt: new Date().toISOString(),
    };
    await db.insert(businesses).values(row);
    return { ...row, sector: (row.sector as Sector | null) ?? null };
  });

export const updateBusiness = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      name?: string;
      sector?: Sector;
      nit?: string;
      cardColor?: string;
      savingsLabel?: string;
      savingsTarget?: number;
      emergencyMonths?: number;
    }) => d,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    const { id, ...patch } = data;
    const clean: Record<string, unknown> = {};
    if (patch.name !== undefined && patch.name.trim()) clean.name = patch.name.trim();
    if (patch.sector !== undefined) clean.sector = patch.sector;
    if (patch.nit !== undefined) clean.nit = patch.nit;
    if (patch.cardColor !== undefined) clean.cardColor = patch.cardColor;
    if (patch.savingsLabel !== undefined) clean.savingsLabel = patch.savingsLabel;
    if (patch.savingsTarget !== undefined) clean.savingsTarget = patch.savingsTarget;
    if (patch.emergencyMonths !== undefined) clean.emergencyMonths = patch.emergencyMonths;
    if (Object.keys(clean).length === 0) return { ok: true };
    await db
      .update(businesses)
      .set(clean)
      .where(and(eq(businesses.id, id), eq(businesses.userId, userId)));
    return { ok: true };
  });

export const deleteBusiness = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    await db.delete(businesses).where(and(eq(businesses.id, id), eq(businesses.userId, userId)));
    return { ok: true };
  });
