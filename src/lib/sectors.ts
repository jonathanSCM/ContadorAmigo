// Rubros económicos y sus fechas de cierre de gestión fiscal en Bolivia.
// Fuente: normativa vigente del SIN. El IUE se declara y paga dentro de los
// 120 días posteriores al cierre de gestión de cada rubro (no es una fecha
// única para todos los negocios).

export type Sector =
  | "comercio_servicios"
  | "industria_petroleras"
  | "agropecuario"
  | "mineria";

export const SECTOR_INFO: Record<
  Sector,
  { label: string; month: number; day: number }
> = {
  comercio_servicios: {
    label: "Comercio, servicios, bancos y seguros",
    month: 12,
    day: 31,
  },
  industria_petroleras: {
    label: "Industriales y petroleras",
    month: 3,
    day: 31,
  },
  agropecuario: {
    label: "Agropecuarias, gomeras y castañeras",
    month: 6,
    day: 30,
  },
  mineria: {
    label: "Mineras",
    month: 9,
    day: 30,
  },
};

export const DEFAULT_SECTOR: Sector = "comercio_servicios";

/**
 * Calcula la gestión fiscal (año contable) en curso según el rubro: el
 * rango de fechas real [inicio, cierre] y la fecha límite de pago del IUE
 * (120 días después del cierre). A diferencia de un año calendario fijo,
 * esto respeta que cada rubro cierra en un mes distinto.
 */
export function gestionRange(
  sector: Sector,
  ref = new Date(),
): { start: Date; end: Date; dueDate: Date } {
  const { month, day } = SECTOR_INFO[sector];
  const closeThisYear = new Date(ref.getFullYear(), month - 1, day, 23, 59, 59);

  let start: Date;
  let end: Date;
  if (ref <= closeThisYear) {
    end = closeThisYear;
    start = new Date(ref.getFullYear() - 1, month - 1, day + 1);
  } else {
    start = new Date(ref.getFullYear(), month - 1, day + 1);
    end = new Date(ref.getFullYear() + 1, month - 1, day, 23, 59, 59);
  }

  const dueDate = new Date(end);
  dueDate.setDate(dueDate.getDate() + 120);

  return { start, end, dueDate };
}
