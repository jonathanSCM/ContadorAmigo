// Tipo canónico de movimiento (ingreso/gasto). La persistencia ahora vive en
// la base de datos vía src/lib/movements.server.ts — este archivo solo
// conserva el tipo, que el resto de la app (tax.ts, analysis.ts, rutas)
// sigue importando desde aquí para no romper referencias existentes.

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
  providerName?: string;
  invoiceNumber?: string;
  providerNit?: string;
}
