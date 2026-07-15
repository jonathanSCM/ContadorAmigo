// Comparador de regímenes tributarios de Bolivia (SIN, vigente 2025–2026).
// Datos: RTS (DS 24484 y actualizaciones), SIETE-RG (DS 5503), Régimen General.

import { IT_RATE, IUE_RATE, IVA_RATE } from "./tax";

export const RTS_CATEGORIAS = [
  { cat: 1, min: 12001, max: 15000, pago: 47 },
  { cat: 2, min: 15001, max: 18700, pago: 90 },
  { cat: 3, min: 18701, max: 23500, pago: 147 },
  { cat: 4, min: 23501, max: 29500, pago: 158 },
  { cat: 5, min: 29501, max: 37000, pago: 200 },
  { cat: 6, min: 37001, max: 60000, pago: 350 },
] as const;

export const RTS_VENTAS_MAX = 184000; // límite anual de ventas del RTS
export const RTS_CAPITAL_MIN = 12001; // debajo de esto: no requiere inscripción
export const RTS_CAPITAL_MAX = 60000;
export const SIETE_VENTAS_MAX = 250000; // límite anual del SIETE-RG
export const SIETE_TASA = 0.05; // monotributo 5% de ventas brutas

export type RegimeId = "ninguno" | "simplificado" | "siete" | "general";

export interface RegimeOption {
  id: RegimeId;
  name: string;
  who: string;
  annual: number; // costo estimado anual en Bs
  headline: string; // cómo se paga (texto corto)
  detail: string[]; // líneas de cálculo/condiciones
  eligible: boolean;
  recommended: boolean;
  note: string;
}

export function rtsCategoria(capital: number) {
  return (
    RTS_CATEGORIAS.find((c) => capital >= c.min && capital <= c.max) ?? null
  );
}

export interface RegimeInput {
  ventasAnuales: number;
  capital: number;
  comprasAnuales: number;
  utilidadAnual: number;
}

export function compareRegimes(input: RegimeInput): {
  options: RegimeOption[];
  recommendedId: RegimeId;
} {
  const { ventasAnuales, capital, comprasAnuales, utilidadAnual } = input;

  // --- Sin inscripción ---
  const ningunoEligible = capital < RTS_CAPITAL_MIN && ventasAnuales < RTS_VENTAS_MAX;

  // --- Régimen Simplificado ---
  const catCapital = Math.max(capital, RTS_CAPITAL_MIN);
  const cat = rtsCategoria(catCapital) ?? RTS_CATEGORIAS[RTS_CATEGORIAS.length - 1];
  const simplificadoEligible =
    capital <= RTS_CAPITAL_MAX && ventasAnuales < RTS_VENTAS_MAX;
  const simplificadoAnnual = cat.pago * 6;

  // --- SIETE-RG ---
  const sieteEligible = ventasAnuales < SIETE_VENTAS_MAX;
  const sieteAnnual = ventasAnuales * SIETE_TASA;

  // --- Régimen General ---
  const ivaDebito = ventasAnuales * IVA_RATE;
  const ivaCredito = comprasAnuales * IVA_RATE;
  const ivaAPagar = Math.max(0, ivaDebito - ivaCredito);
  const it = ventasAnuales * IT_RATE;
  const iue = Math.max(0, utilidadAnual) * IUE_RATE;
  const generalAnnual = ivaAPagar + it + iue;

  // --- Recomendación: el más conveniente entre los elegibles, con orden de prioridad ---
  let recommendedId: RegimeId;
  if (ningunoEligible) recommendedId = "ninguno";
  else if (simplificadoEligible) recommendedId = "simplificado";
  else if (sieteEligible) recommendedId = "siete";
  else recommendedId = "general";

  const options: RegimeOption[] = [
    {
      id: "ninguno",
      name: "Sin inscripción",
      who: "Negocios de subsistencia muy pequeños",
      annual: 0,
      headline: "Bs 0 — no requiere inscripción",
      detail: [
        `Capital menor a Bs ${RTS_CAPITAL_MIN.toLocaleString("es-BO")}`,
        `Ventas anuales menores a Bs ${RTS_VENTAS_MAX.toLocaleString("es-BO")}`,
        "No emite factura",
      ],
      eligible: ningunoEligible,
      recommended: recommendedId === "ninguno",
      note: "La ley no obliga a inscribirte, pero llevar tus cuentas te ayuda a crecer.",
    },
    {
      id: "simplificado",
      name: "Régimen Simplificado (RTS)",
      who: "Artesanos, comerciantes minoristas y vivanderos",
      annual: simplificadoAnnual,
      headline: `Categoría ${cat.cat} · Bs ${cat.pago} bimestral`,
      detail: [
        `Tu capital: Bs ${capital.toLocaleString("es-BO")} → Categoría ${cat.cat}`,
        `Pago fijo: Bs ${cat.pago} × 6 bimestres`,
        "No importa cuánto vendas, el pago es fijo",
      ],
      eligible: simplificadoEligible,
      recommended: recommendedId === "simplificado",
      note: "Pagas un monto fijo cada 2 meses según tu capital. No emites factura con crédito fiscal.",
    },
    {
      id: "siete",
      name: "SIETE-RG",
      who: "Emprendedores formales en transición",
      annual: sieteAnnual,
      headline: "5% de las ventas · bimestral",
      detail: [
        `Ventas del año: Bs ${Math.round(ventasAnuales).toLocaleString("es-BO")}`,
        `Monotributo: 5% = Bs ${Math.round(sieteAnnual).toLocaleString("es-BO")}`,
        "Reemplaza IVA + IT + IUE en un solo pago",
      ],
      eligible: sieteEligible,
      recommended: recommendedId === "siete",
      note: "Ideal para formalizarte con ventas menores a Bs 250.000/año. Válido hasta 3 años.",
    },
    {
      id: "general",
      name: "Régimen General",
      who: "Empresas y negocios en crecimiento",
      annual: generalAnnual,
      headline: "IVA 13% · IT 3% · IUE 25%",
      detail: [
        `IVA a pagar: Bs ${Math.round(ivaAPagar).toLocaleString("es-BO")} (débito − crédito)`,
        `IT: Bs ${Math.round(it).toLocaleString("es-BO")} (3% de ventas)`,
        `IUE: Bs ${Math.round(iue).toLocaleString("es-BO")} (25% de utilidad)`,
      ],
      eligible: true,
      recommended: recommendedId === "general",
      note: "Emites factura. El IVA de tus compras descuenta el de tus ventas. IUE una vez al año.",
    },
  ];

  return { options, recommendedId };
}
