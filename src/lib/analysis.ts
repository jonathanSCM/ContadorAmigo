// Análisis financiero: Estado de Resultados (P&L) y tendencia mensual.
import type { Movement } from "./storage";
import { IT_RATE, IVA_RATE } from "./tax";

// "dia" y "semana" son resúmenes de caja INFORMATIVOS: en Bolivia no existe
// obligación tributaria diaria ni semanal (IVA/IT son mensuales, IUE anual),
// así que estos periodos nunca deben mostrarse como "impuesto a pagar".
export type Period = "dia" | "semana" | "mes" | "anio" | "todo";

/** Monto bruto (con IVA si tiene factura), consistente con balance(). */
export const gross = (m: Movement) =>
  m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;

const COSTO_VENTAS_CATS = new Set(["Insumos"]);
const INVERSION_CATS = new Set(["Activo Fijo"]);

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
/** Lunes de la semana de `d` (semana calendario, lunes a domingo). */
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=domingo
  const diff = day === 0 ? -6 : 1 - day;
  const s = new Date(d);
  s.setDate(d.getDate() + diff);
  return startOfDay(s);
}
function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return endOfDay(e);
}

/** Rango [inicio, fin] correspondiente a un período, para mostrar fechas claras. */
export function periodRange(
  movs: Movement[],
  period: Period,
  ref = new Date(),
): { start: Date; end: Date } {
  switch (period) {
    case "dia":
      return { start: startOfDay(ref), end: endOfDay(ref) };
    case "semana":
      return { start: startOfWeek(ref), end: endOfWeek(ref) };
    case "mes":
      return {
        start: new Date(ref.getFullYear(), ref.getMonth(), 1),
        end: new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "anio":
      return {
        start: new Date(ref.getFullYear(), 0, 1),
        end: new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "todo": {
      if (movs.length === 0) return { start: ref, end: ref };
      const dates = movs.map((m) => new Date(m.date).getTime());
      return { start: new Date(Math.min(...dates)), end: new Date(Math.max(...dates)) };
    }
  }
}

export function filterByPeriod(
  movs: Movement[],
  period: Period,
  ref = new Date(),
): Movement[] {
  if (period === "todo") return movs;
  const { start, end } = periodRange(movs, period, ref);
  return movs.filter((m) => {
    const d = new Date(m.date);
    return d >= start && d <= end;
  });
}

export function filterByRange(movs: Movement[], start: Date, end: Date): Movement[] {
  return movs.filter((m) => {
    const d = new Date(m.date);
    return d >= start && d <= end;
  });
}

export interface OperativoRow {
  label: string;
  value: number;
}

export interface PnL {
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  margenBruto: number;
  gastosOperativos: number;
  operativos: OperativoRow[];
  inversion: number;
  utilidadOperativa: number;
  ivaDebito: number;
  ivaCredito: number;
  ivaAPagar: number;
  it: number;
  impuestos: number;
  utilidadNeta: number;
  margenNeto: number;
}

export function profitAndLoss(
  movs: Movement[],
  period: Period,
  ref = new Date(),
): PnL {
  return pnlCore(filterByPeriod(movs, period, ref));
}

/** Estado de Resultados sobre un rango de fechas explícito (p. ej. una gestión fiscal). */
export function profitAndLossRange(movs: Movement[], start: Date, end: Date): PnL {
  return pnlCore(filterByRange(movs, start, end));
}

function pnlCore(inPeriod: Movement[]): PnL {
  let ingresos = 0;
  let costoVentas = 0;
  let inversion = 0;
  let ivaDebito = 0;
  let ivaCredito = 0;
  const opMap = new Map<string, number>();

  for (const m of inPeriod) {
    const g = gross(m);
    const iva = m.hasInvoice ? m.amountNet * IVA_RATE : 0;
    if (m.type === "ingreso") {
      ingresos += g;
      ivaDebito += iva;
    } else {
      ivaCredito += iva;
      if (COSTO_VENTAS_CATS.has(m.category)) {
        costoVentas += g;
      } else if (INVERSION_CATS.has(m.category)) {
        inversion += g;
      } else {
        opMap.set(m.category, (opMap.get(m.category) ?? 0) + g);
      }
    }
  }

  const utilidadBruta = ingresos - costoVentas;
  const operativos = [...opMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const gastosOperativos = operativos.reduce((s, o) => s + o.value, 0);
  const utilidadOperativa = utilidadBruta - gastosOperativos - inversion;

  const ivaAPagar = Math.max(0, ivaDebito - ivaCredito);
  const it = ingresos * IT_RATE;
  const impuestos = ivaAPagar + it;
  const utilidadNeta = utilidadOperativa - impuestos;

  return {
    ingresos,
    costoVentas,
    utilidadBruta,
    margenBruto: ingresos > 0 ? utilidadBruta / ingresos : 0,
    gastosOperativos,
    operativos,
    inversion,
    utilidadOperativa,
    ivaDebito,
    ivaCredito,
    ivaAPagar,
    it,
    impuestos,
    utilidadNeta,
    margenNeto: ingresos > 0 ? utilidadNeta / ingresos : 0,
  };
}

export interface MonthPoint {
  key: string; // YYYY-MM
  label: string; // "jul"
  ingresos: number;
  gastos: number;
  utilidad: number;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function monthlyTrend(
  movs: Movement[],
  months = 6,
  ref = new Date(),
): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({ key, label: MESES[d.getMonth()], ingresos: 0, gastos: 0, utilidad: 0 });
  }
  const idx = new Map(points.map((p, i) => [p.key, i]));
  for (const m of movs) {
    const d = new Date(m.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const i = idx.get(key);
    if (i === undefined) continue;
    const g = gross(m);
    if (m.type === "ingreso") points[i].ingresos += g;
    else points[i].gastos += g;
  }
  for (const p of points) p.utilidad = p.ingresos - p.gastos;
  return points;
}

export interface AnnualEstimate {
  ventas: number;
  compras: number; // compras con factura (para crédito fiscal)
  gastos: number;
  utilidad: number;
  mesesBase: number;
}

/**
 * Estima cifras anuales promediando los meses YA COMPLETOS (excluye el mes en
 * curso, que es parcial) y multiplicando por 12. Base para el comparador.
 */
export function annualEstimate(movs: Movement[], ref = new Date()): AnnualEstimate {
  const curKey = `${ref.getFullYear()}-${ref.getMonth()}`;
  const months = new Map<string, { ventas: number; compras: number; gastos: number }>();
  for (const m of movs) {
    const d = new Date(m.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key === curKey) continue; // excluir mes parcial
    const acc = months.get(key) ?? { ventas: 0, compras: 0, gastos: 0 };
    const g = gross(m);
    if (m.type === "ingreso") acc.ventas += g;
    else {
      acc.gastos += g;
      if (m.hasInvoice) acc.compras += g;
    }
    months.set(key, acc);
  }
  const n = months.size;
  if (n === 0) {
    return { ventas: 0, compras: 0, gastos: 0, utilidad: 0, mesesBase: 0 };
  }
  let ventas = 0,
    compras = 0,
    gastos = 0;
  for (const v of months.values()) {
    ventas += v.ventas;
    compras += v.compras;
    gastos += v.gastos;
  }
  const factor = 12 / n;
  return {
    ventas: ventas * factor,
    compras: compras * factor,
    gastos: gastos * factor,
    utilidad: (ventas - gastos) * factor,
    mesesBase: n,
  };
}

/** Costos fijos mensuales promedio (Fijos + Salarios), para fondo de emergencia. */
export function monthlyFixedCosts(movs: Movement[], months = 3, ref = new Date()): number {
  const cats = new Set(["Fijos", "Salarios"]);
  const cutoff = new Date(ref.getFullYear(), ref.getMonth() - months, 1);
  let total = 0;
  let monthsSeen = new Set<string>();
  for (const m of movs) {
    if (m.type !== "gasto" || !cats.has(m.category)) continue;
    const d = new Date(m.date);
    if (d < cutoff) continue;
    total += gross(m);
    monthsSeen.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  const n = Math.max(1, monthsSeen.size);
  return total / n;
}

export interface ProviderRow {
  name: string;
  compras: number; // total de compras (con y sin factura)
  facturas: number; // cuántas de esas compras tienen factura
  monto: number; // monto total gastado (bruto)
  creditoFiscal: number; // IVA crédito fiscal generado por ese proveedor
}

/** Agrupa los gastos por proveedor: cuántas compras, cuántas con factura y el monto. */
export function providerSummary(movs: Movement[], period: Period, ref = new Date()): ProviderRow[] {
  return providerSummaryCore(filterByPeriod(movs, period, ref));
}

/** Igual que `providerSummary`, pero sobre un rango de fechas explícito. */
export function providerSummaryRange(movs: Movement[], start: Date, end: Date): ProviderRow[] {
  return providerSummaryCore(filterByRange(movs, start, end));
}

function providerSummaryCore(inPeriod: Movement[]): ProviderRow[] {
  const map = new Map<string, ProviderRow>();
  for (const m of inPeriod) {
    if (m.type !== "gasto" || !m.providerName?.trim()) continue;
    const key = m.providerName.trim();
    const row = map.get(key) ?? { name: key, compras: 0, facturas: 0, monto: 0, creditoFiscal: 0 };
    row.compras += 1;
    row.monto += gross(m);
    if (m.hasInvoice) {
      row.facturas += 1;
      row.creditoFiscal += m.amountNet * IVA_RATE;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.monto - a.monto);
}
