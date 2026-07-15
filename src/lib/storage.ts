// LocalStorage-backed store for movimientos (movements).
// All amounts stored in Bs (bolivianos).

export type MovementType = "ingreso" | "gasto";

export interface Movement {
  id: string;
  type: MovementType;
  concept: string;
  amountNet: number; // subtotal sin IVA
  hasInvoice: boolean; // si tiene factura -> genera débito/crédito fiscal
  category: string;
  date: string; // ISO date
  note?: string;
}

import { bizKey } from "./profiles";

const movKey = () => bizKey("movements");
const nitKey = () => bizKey("nit");

export function loadMovements(): Movement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(movKey());
    if (!raw) return seedDemo();
    const parsed = JSON.parse(raw) as Movement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMovements(movs: Movement[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(movKey(), JSON.stringify(movs));
}

export function loadNit(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(nitKey()) ?? "";
}
export function saveNit(nit: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(nitKey(), nit);
}

// ----- Controles de datos -----

/** Vuelve a cargar el negocio de ejemplo (Dulce Illimani). */
export function resetToDemo(): Movement[] {
  const data = buildDemo();
  saveMovements(data);
  saveNit(DEMO_NIT);
  return data;
}

/** Borra todos los movimientos y deja el sistema en blanco. */
export function clearAll(): Movement[] {
  saveMovements([]);
  return [];
}

/** Exporta todo a texto JSON (para respaldo .json). */
export function exportData(): string {
  return JSON.stringify(
    { version: 1, nit: loadNit(), movements: loadMovements() },
    null,
    2,
  );
}

/** Importa desde un respaldo .json. Devuelve los movimientos cargados. */
export function importData(json: string): Movement[] {
  const parsed = JSON.parse(json) as { nit?: string; movements?: Movement[] };
  if (!parsed.movements || !Array.isArray(parsed.movements)) {
    throw new Error("El archivo no contiene movimientos válidos.");
  }
  saveMovements(parsed.movements);
  if (typeof parsed.nit === "string") saveNit(parsed.nit);
  return parsed.movements;
}

// ============================================================
// NEGOCIO DE EJEMPLO — "Dulce Illimani, repostería artesanal" (La Paz)
// 6 meses de historial con tendencia de crecimiento, para que el
// sistema se vea "en uso" al abrirlo por primera vez.
// ============================================================

export const DEMO_NIT = "4083927015"; // termina en 5 → vencimiento día 18
export const DEMO_BUSINESS = "Dulce Illimani";

function seedDemo(): Movement[] {
  const data = buildDemo();
  saveMovements(data);
  saveNit(DEMO_NIT);
  return data;
}

function buildDemo(): Movement[] {
  const now = new Date();
  const movs: Movement[] = [];
  let counter = 0;
  const id = () => `demo-${counter++}`;

  // Fecha dentro de un mes relativo (0 = mes actual, 1 = mes pasado...)
  const at = (monthsAgo: number, day: number) =>
    new Date(now.getFullYear(), now.getMonth() - monthsAgo, day).toISOString();

  const add = (
    monthsAgo: number,
    day: number,
    type: MovementType,
    concept: string,
    amountNet: number,
    hasInvoice: boolean,
    category: string,
  ) => {
    if (amountNet <= 0) return;
    // En el mes actual solo registramos hasta el día de hoy (mes en curso).
    if (monthsAgo === 0 && day > now.getDate()) return;
    movs.push({
      id: id(),
      type,
      concept,
      amountNet: Math.round(amountNet),
      hasInvoice,
      category,
      date: at(monthsAgo, day),
    });
  };

  // Factor de crecimiento: meses más recientes venden más.
  const scaleFor = (monthsAgo: number) => {
    const table: Record<number, number> = {
      5: 0.82,
      4: 0.9,
      3: 0.98,
      2: 1.08,
      1: 1.18,
      0: 1.24,
    };
    return table[monthsAgo] ?? 1;
  };

  for (let m = 5; m >= 0; m--) {
    const s = scaleFor(m);

    // --- INGRESOS (ventas de repostería) ---
    // Ventas densas en la primera quincena para que el mes en curso
    // luzca saludable aunque solo haya transcurrido la mitad del mes.
    add(m, 2, "ingreso", "Venta mostrador — inicio de mes", 520 * s, false, "Ventas");
    add(m, 4, "ingreso", "Torta de cumpleaños por encargo", 680 * s, true, "Ventas");
    add(m, 6, "ingreso", "Venta mostrador — cupcakes y galletas", 560 * s, false, "Ventas");
    add(m, 8, "ingreso", "Pedido corporativo — 60 porciones", 860 * s, true, "Servicios");
    add(m, 10, "ingreso", "Venta mostrador — fin de semana", 640 * s, false, "Ventas");
    add(m, 12, "ingreso", "Torta de bodas por encargo", 940 * s, true, "Ventas");
    add(m, 13, "ingreso", "Venta mostrador — media quincena", 700 * s, false, "Ventas");
    add(m, 16, "ingreso", "Pedido cafetería aliada", 720 * s, true, "Servicios");
    add(m, 20, "ingreso", "Venta mostrador — semana", 610 * s, false, "Ventas");
    add(m, 24, "ingreso", "Torta temática por encargo", 780 * s, true, "Ventas");
    add(m, 27, "ingreso", "Venta mostrador — cierre de mes", 560 * s, false, "Ventas");

    // --- GASTOS ---
    // Insumos (costo de ventas) — con factura (crédito fiscal)
    add(m, 2, "gasto", "Insumos — harina, huevos, azúcar", 700 * s, true, "Insumos");
    add(m, 11, "gasto", "Insumos — chocolate, frutas, lácteos", 560 * s, true, "Insumos");
    add(m, 18, "gasto", "Empaques y descartables", 480 * s, true, "Insumos");
    // Costos fijos
    add(m, 3, "gasto", "Alquiler del local", 900, false, "Fijos");
    add(m, 5, "gasto", "Luz, agua e internet", 290, true, "Fijos");
    add(m, 10, "gasto", "Sueldo ayudante de cocina", 1600, false, "Salarios");
    // Variables ocasionales
    add(m, 8, "gasto", "Publicidad en redes sociales", 260, true, "Marketing");
    add(m, 12, "gasto", "Transporte y delivery", 150, false, "Otros");
    if (m === 2) {
      add(m, 19, "gasto", "Mantenimiento de horno", 450, true, "Otros");
    }
  }

  // Más recientes primero (para "Últimos movimientos").
  return movs.sort((a, b) => b.date.localeCompare(a.date));
}
