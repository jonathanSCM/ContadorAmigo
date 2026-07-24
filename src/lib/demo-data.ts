// Generador puro del negocio de ejemplo "Dulce Illimani" (repostería, La Paz).
// Usado por el botón "Cargar datos de ejemplo" — inserta movimientos reales
// vía server function, ya no directo a localStorage.

export interface DemoMovement {
  type: "ingreso" | "gasto";
  concept: string;
  amountNet: number;
  hasInvoice: boolean;
  category: string;
  date: string; // ISO
  providerName?: string;
  invoiceNumber?: string;
  providerNit?: string;
}

export const DEMO_BUSINESS_NAME = "Dulce Illimani";

export function buildDemoMovements(now = new Date()): DemoMovement[] {
  const movs: DemoMovement[] = [];

  const at = (monthsAgo: number, day: number) =>
    new Date(now.getFullYear(), now.getMonth() - monthsAgo, day).toISOString();

  const add = (
    monthsAgo: number,
    day: number,
    type: "ingreso" | "gasto",
    concept: string,
    amountNet: number,
    hasInvoice: boolean,
    category: string,
    provider?: { name: string; invoiceNumber?: string; nit?: string },
  ) => {
    if (amountNet <= 0) return;
    if (monthsAgo === 0 && day > now.getDate()) return;
    movs.push({
      type,
      concept,
      amountNet: Math.round(amountNet),
      hasInvoice,
      category,
      date: at(monthsAgo, day),
      providerName: provider?.name,
      invoiceNumber: hasInvoice ? provider?.invoiceNumber : undefined,
      providerNit: hasInvoice ? provider?.nit : undefined,
    });
  };

  const scaleFor = (monthsAgo: number) => {
    const table: Record<number, number> = { 5: 0.82, 4: 0.9, 3: 0.98, 2: 1.08, 1: 1.18, 0: 1.24 };
    return table[monthsAgo] ?? 1;
  };

  for (let m = 5; m >= 0; m--) {
    const s = scaleFor(m);

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

    add(m, 2, "gasto", "Insumos — harina, huevos, azúcar", 700 * s, true, "Insumos", {
      name: "Distribuidora La Cruceña",
      invoiceNumber: `F-${1000 + m * 3}`,
      nit: "1023845017",
    });
    add(m, 11, "gasto", "Insumos — chocolate, frutas, lácteos", 560 * s, m % 3 !== 0, "Insumos", {
      name: "Distribuidora La Cruceña",
      invoiceNumber: m % 3 !== 0 ? `F-${1001 + m * 3}` : undefined,
      nit: "1023845017",
    });
    add(m, 18, "gasto", "Empaques y descartables", 480 * s, true, "Insumos", {
      name: "Empaques del Oriente",
      invoiceNumber: `F-${2200 + m * 2}`,
      nit: "5091827364",
    });
    add(m, 3, "gasto", "Alquiler del local", 900, false, "Fijos", { name: "Propietario del local" });
    add(m, 5, "gasto", "Luz, agua e internet", 290, true, "Fijos", {
      name: "CRE / SAGUAPAC",
      invoiceNumber: `E-${88000 + m}`,
      nit: "1000000019",
    });
    add(m, 10, "gasto", "Sueldo ayudante de cocina", 1600, false, "Salarios");
    add(m, 8, "gasto", "Publicidad en redes sociales", 260, true, "Marketing", {
      name: "Estudio Creativo Andino",
      invoiceNumber: `F-${340 + m}`,
      nit: "7261548930",
    });
    add(m, 12, "gasto", "Transporte y delivery", 150, false, "Otros", { name: "Mototaxi local" });
    if (m === 2) {
      add(m, 19, "gasto", "Mantenimiento de horno", 450, true, "Otros", {
        name: "Servitécnica Industrial",
        invoiceNumber: "F-9042",
        nit: "3345678012",
      });
    }
  }

  return movs;
}

export const DEMO_PRODUCTS = [
  { name: "Torta de chocolate (mediana)", cost: 45, price: 120 },
  { name: "Docena de cupcakes", cost: 32, price: 85 },
  { name: "Bolsa de galletas artesanales", cost: 9, price: 22 },
  { name: "Café americano", cost: 4, price: 12 },
  { name: "Torta de bodas (3 pisos)", cost: 320, price: 850 },
];

export const DEMO_BALANCE_ITEMS: {
  category: "activo_corriente" | "activo_fijo" | "pasivo_corriente" | "pasivo_no_corriente" | "capital_propio";
  name: string;
  amount: number;
}[] = [
  { category: "activo_corriente", name: "Caja y bancos", amount: 3500 },
  { category: "activo_corriente", name: "Inventario de insumos (harina, chocolate, envases)", amount: 1800 },
  { category: "activo_fijo", name: "Horno industrial", amount: 8500 },
  { category: "activo_fijo", name: "Mobiliario y vitrinas", amount: 2200 },
  { category: "activo_fijo", name: "Vehículo de reparto", amount: 12000 },
  { category: "pasivo_corriente", name: "Cuentas por pagar a proveedores", amount: 1200 },
  { category: "pasivo_no_corriente", name: "Préstamo bancario (compra de horno)", amount: 6000 },
  { category: "capital_propio", name: "Capital inicial del negocio", amount: 7400 },
];
