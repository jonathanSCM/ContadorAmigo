import type { Movement } from "./storage";

export const IVA_RATE = 0.13;
export const IT_RATE = 0.03;
export const IUE_RATE = 0.25;

export function formatBs(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `Bs ${rounded.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isCurrentMonth(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export interface MonthlySummary {
  ingresos: number;
  gastos: number;
  utilidad: number;
  ivaDebito: number; // IVA cobrado en ventas facturadas
  ivaCredito: number; // IVA pagado en compras con factura
  ivaAPagar: number; // débito - crédito (min 0)
  itAPagar: number; // 3% de ingresos brutos
  totalImpuestos: number;
}

export function calcMonthly(movs: Movement[], ref = new Date()): MonthlySummary {
  const inMonth = movs.filter((m) => isCurrentMonth(m.date, ref));
  let ingresos = 0,
    gastos = 0,
    ivaDebito = 0,
    ivaCredito = 0;

  for (const m of inMonth) {
    const gross = m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;
    const iva = m.hasInvoice ? m.amountNet * IVA_RATE : 0;
    if (m.type === "ingreso") {
      ingresos += gross;
      ivaDebito += iva;
    } else {
      gastos += gross;
      ivaCredito += iva;
    }
  }
  const utilidad = ingresos - gastos;
  const ivaAPagar = Math.max(0, ivaDebito - ivaCredito);
  const itAPagar = ingresos * IT_RATE;
  return {
    ingresos,
    gastos,
    utilidad,
    ivaDebito,
    ivaCredito,
    ivaAPagar,
    itAPagar,
    totalImpuestos: ivaAPagar + itAPagar,
  };
}

export function balance(movs: Movement[]): number {
  return movs.reduce((acc, m) => {
    const gross = m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;
    return acc + (m.type === "ingreso" ? gross : -gross);
  }, 0);
}

export type Health = "verde" | "amarillo" | "rojo";
export function healthStatus(s: MonthlySummary): {
  level: Health;
  label: string;
  description: string;
} {
  if (s.ingresos === 0)
    return {
      level: "amarillo",
      label: "Sin datos",
      description: "Aún no hay ingresos registrados este mes.",
    };
  const margen = s.utilidad / s.ingresos;
  const cubreImpuestos = s.utilidad >= s.totalImpuestos;
  if (margen >= 0.2 && cubreImpuestos)
    return {
      level: "verde",
      label: "Salud óptima",
      description: "Tus ingresos cubren gastos e impuestos con buen margen.",
    };
  if (margen >= 0.05 && cubreImpuestos)
    return {
      level: "amarillo",
      label: "Atención",
      description: "El margen es ajustado. Revisa gastos o mejora precios.",
    };
  return {
    level: "rojo",
    label: "Riesgo",
    description: "Los gastos e impuestos superan tu utilidad. Ajusta pronto.",
  };
}

// Vencimiento IVA/IT según último dígito del NIT (Res. SIN, esquema simplificado)
const VENC: Record<string, number> = {
  "0": 13, "1": 14, "2": 15, "3": 16, "4": 17,
  "5": 18, "6": 19, "7": 20, "8": 21, "9": 22,
};
export function nextTaxDue(nit: string, ref = new Date()): { date: Date; day: number } {
  const last = (nit || "0").slice(-1);
  const day = VENC[last] ?? 13;
  const d = new Date(ref.getFullYear(), ref.getMonth() + 1, day);
  return { date: d, day };
}
