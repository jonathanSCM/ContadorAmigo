// Balance General simplificado (Estado de Situación Financiera): Activos, Pasivos y Patrimonio.
// No es partida doble; es un resumen manual del stock de bienes y deudas del negocio, distinto
// del flujo de ingresos/gastos que ya cubre lib/analysis.ts.
import type { Movement } from "./storage";
import { profitAndLoss } from "./analysis";

export type BalanceCategory =
  | "activo_corriente"
  | "activo_fijo"
  | "pasivo_corriente"
  | "pasivo_no_corriente"
  | "capital_propio";

export interface BalanceItem {
  id: string;
  businessId: string;
  category: BalanceCategory;
  name: string;
  amount: number;
  createdAt: string;
}

export interface BalanceSheet {
  activoCorriente: number;
  activoFijo: number;
  activoTotal: number;
  pasivoCorriente: number;
  pasivoNoCorriente: number;
  pasivoTotal: number;
  capitalPropio: number;
  utilidadesAcumuladas: number;
  patrimonioTotal: number;
  diferencia: number; // activoTotal - (pasivoTotal + patrimonioTotal)
}

export function balanceSheet(items: BalanceItem[], movs: Movement[]): BalanceSheet {
  const sum = (cat: BalanceCategory) =>
    items.filter((i) => i.category === cat).reduce((acc, i) => acc + i.amount, 0);

  const activoCorriente = sum("activo_corriente");
  const activoFijo = sum("activo_fijo");
  const activoTotal = activoCorriente + activoFijo;
  // "pasivo" es el valor legado (antes de separar corto/largo plazo): se cuenta
  // como corriente para no perder datos de negocios que ya lo tenían cargado.
  const pasivoCorriente = sum("pasivo_corriente") + sum("pasivo" as BalanceCategory);
  const pasivoNoCorriente = sum("pasivo_no_corriente");
  const pasivoTotal = pasivoCorriente + pasivoNoCorriente;
  const capitalPropio = sum("capital_propio");
  const utilidadesAcumuladas = profitAndLoss(movs, "todo").utilidadNeta;
  const patrimonioTotal = capitalPropio + utilidadesAcumuladas;

  return {
    activoCorriente,
    activoFijo,
    activoTotal,
    pasivoCorriente,
    pasivoNoCorriente,
    pasivoTotal,
    capitalPropio,
    utilidadesAcumuladas,
    patrimonioTotal,
    diferencia: activoTotal - (pasivoTotal + patrimonioTotal),
  };
}
