// Catálogo de productos y calculadora de precios (localStorage).
import { bizKey } from "./profiles";

export interface Product {
  id: string;
  name: string;
  cost: number; // costo variable por unidad (Bs)
  price: number; // precio de venta por unidad (Bs)
}

const key = () => bizKey("products");

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key());
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProducts(list: Product[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(), JSON.stringify(list));
}

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

function seed(): Product[] {
  const initial: Product[] = [
    { id: crypto.randomUUID(), name: "Torta de chocolate (mediana)", cost: 45, price: 120 },
    { id: crypto.randomUUID(), name: "Docena de cupcakes", cost: 32, price: 85 },
    { id: crypto.randomUUID(), name: "Bolsa de galletas artesanales", cost: 9, price: 22 },
    { id: crypto.randomUUID(), name: "Café americano", cost: 4, price: 12 },
    { id: crypto.randomUUID(), name: "Torta de bodas (3 pisos)", cost: 320, price: 850 },
  ];
  saveProducts(initial);
  return initial;
}
