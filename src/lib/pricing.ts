// Funciones puras de cálculo de precios (sin dependencia de almacenamiento).

export function marginPct(p: { cost: number; price: number }): number {
  if (p.price <= 0) return 0;
  return (p.price - p.cost) / p.price;
}

/** Precio sugerido para un margen deseado (%): precio = costo / (1 − margen). */
export function priceForMargin(cost: number, margin: number): number {
  const m = Math.min(0.95, Math.max(0, margin));
  return cost / (1 - m);
}

/** Markup: cuánto se multiplica el costo. */
export function markup(p: { cost: number; price: number }): number {
  if (p.cost <= 0) return 0;
  return p.price / p.cost;
}
