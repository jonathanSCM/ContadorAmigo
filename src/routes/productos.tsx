import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ConceptPopover } from "@/components/ConceptPopover";
import { formatBs, IVA_RATE } from "@/lib/tax";
import {
  loadProducts,
  marginPct,
  markup,
  priceForMargin,
  saveProducts,
  type Product,
} from "@/lib/products";
import { loadMovements } from "@/lib/storage";
import { monthlyFixedCosts } from "@/lib/analysis";
import { AlertTriangle, Trash2, Trophy } from "lucide-react";

export const Route = createFileRoute("/productos")({
  head: () => ({
    meta: [
      { title: "Productos y Precios — ContadorAmigo" },
      {
        name: "description",
        content:
          "Calcula el precio justo de tus productos y descubre cuánto necesitas vender para no perder.",
      },
    ],
  }),
  component: Productos,
});

function toneForMargin(m: number) {
  if (m >= 0.4) return "text-success";
  if (m >= 0.2) return "text-warning";
  return "text-danger";
}
function bgForMargin(m: number) {
  if (m >= 0.4) return "bg-success/10 text-success";
  if (m >= 0.2) return "bg-warning/15 text-warning-foreground";
  return "bg-danger/10 text-danger";
}

function Productos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCosts, setFixedCosts] = useState(0);

  // Calculadora de precio
  const [cost, setCost] = useState("40");
  const [margin, setMargin] = useState(55); // % deseado

  // Nuevo producto
  const [nName, setNName] = useState("");
  const [nCost, setNCost] = useState("");
  const [nPrice, setNPrice] = useState("");

  useEffect(() => {
    setProducts(loadProducts());
    setFixedCosts(Math.round(monthlyFixedCosts(loadMovements())));
  }, []);

  const costNum = parseFloat(cost) || 0;
  const price = useMemo(() => priceForMargin(costNum, margin / 100), [costNum, margin]);
  const gainPerUnit = price - costNum;
  const priceConFactura = price * (1 + IVA_RATE);

  const ranked = useMemo(
    () => [...products].sort((a, b) => marginPct(b) - marginPct(a)),
    [products],
  );
  const bajos = ranked.filter((p) => marginPct(p) < 0.2);

  // Punto de equilibrio (usa el margen de contribución de la calculadora)
  const mc = price - costNum;
  const breakevenUnits = mc > 0 ? Math.ceil(fixedCosts / mc) : 0;
  const breakevenBs = breakevenUnits * price;

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(nCost);
    const p = parseFloat(nPrice);
    if (!nName.trim() || !c || !p || c < 0 || p <= 0) {
      toast.error("Completa nombre, costo y precio válidos");
      return;
    }
    const next = [
      ...products,
      { id: crypto.randomUUID(), name: nName.trim(), cost: c, price: p },
    ];
    setProducts(next);
    saveProducts(next);
    toast.success("Producto agregado");
    setNName("");
    setNCost("");
    setNPrice("");
  };

  const remove = (id: string) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    saveProducts(next);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl space-y-8 p-6">
        <header className="animate-reveal">
          <h1 className="font-serif text-4xl italic">Productos y precios</h1>
          <p className="mt-2 max-w-2xl text-foreground/60">
            Poner precio no es adivinar. Aquí calculas un precio que cubre tus costos y te deja
            ganancia, y descubres cuánto necesitas vender para no perder.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Calculadora de precio */}
          <section className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl italic">Precio justo</h2>
              <ConceptPopover conceptKey="margen-contribucion" />
            </div>

            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              ¿Cuánto te cuesta producir una unidad? (costo variable)
            </label>
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-sm italic text-foreground/40">
                Bs
              </span>
              <input
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value.replace(",", "."))}
                className="w-full rounded-xl bg-secondary py-3 pl-10 pr-4 text-xl font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
              />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                Margen de ganancia deseado
              </label>
              <span className={`font-bold ${toneForMargin(margin / 100)}`}>{margin}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={90}
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="mb-6 w-full accent-primary"
            />

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Precio de venta sugerido
              </p>
              <p className="my-1 font-serif text-5xl italic">{formatBs(price)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
                <div>
                  <p className="text-xs opacity-70">Ganas por unidad</p>
                  <p className="font-bold">{formatBs(gainPerUnit)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Multiplicas el costo</p>
                  <p className="font-bold">{markup({ cost: costNum, price }).toFixed(2)}×</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Si facturas (con IVA)</p>
                  <p className="font-bold">{formatBs(priceConFactura)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Margen real</p>
                  <p className="font-bold">{(marginPct({ cost: costNum, price }) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </section>

          {/* Punto de equilibrio */}
          <section className="animate-reveal [animation-delay:100ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl italic">Punto de equilibrio</h2>
              <ConceptPopover conceptKey="punto-equilibrio" />
            </div>
            <p className="mb-5 text-sm text-foreground/60">
              Con el precio y costo de la izquierda, ¿cuántas unidades debes vender al mes para cubrir
              tus costos fijos?
            </p>

            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Costos fijos del mes (alquiler, sueldos, servicios)
            </label>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-sm italic text-foreground/40">
                Bs
              </span>
              <input
                inputMode="decimal"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-secondary py-3 pl-10 pr-4 text-lg font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
              />
              <p className="mt-1 text-xs text-foreground/40">
                Calculado desde tus movimientos. Puedes ajustarlo.
              </p>
            </div>

            {mc > 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-secondary p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Necesitas vender al mes
                </p>
                <p className="my-1 font-serif text-5xl italic">
                  {breakevenUnits.toLocaleString("es-BO")}
                  <span className="text-2xl"> unidades</span>
                </p>
                <p className="text-sm text-foreground/60">
                  equivalente a <span className="font-bold">{formatBs(breakevenBs)}</span> en ventas.
                </p>
                <div className="mt-4 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Margen de contribución por unidad</span>
                    <span className="font-bold text-success">{formatBs(mc)}</span>
                  </div>
                  <p className="mt-3 text-xs text-foreground/50">
                    Cada unidad que vendas por encima de {breakevenUnits} te deja {formatBs(mc)}{" "}
                    limpios.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-danger/10 p-6 text-sm text-danger">
                <p className="font-bold">Tu costo es igual o mayor a tu precio.</p>
                <p className="mt-1">
                  Con cada venta pierdes dinero. Sube el precio o baja el costo antes de continuar.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Ranking de rentabilidad */}
        {products.length > 0 && (
          <section className="animate-reveal [animation-delay:150ms]">
            <h2 className="mb-4 px-2 font-serif text-2xl italic">Ranking de rentabilidad</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-card p-6 ring-1 ring-black/5">
                <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-success">
                  <Trophy className="size-4" /> Tus productos más rentables
                </p>
                <div className="space-y-2">
                  {ranked.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success/10 text-xs font-bold text-success">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-foreground/50">
                        deja {formatBs(p.price - p.cost)}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bgForMargin(marginPct(p))}`}>
                        {(marginPct(p) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-card p-6 ring-1 ring-black/5">
                <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-danger">
                  <AlertTriangle className="size-4" /> A revisar (margen bajo)
                </p>
                {bajos.length > 0 ? (
                  <div className="space-y-2">
                    {bajos.map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-foreground/50">
                          deja solo {formatBs(p.price - p.cost)}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bgForMargin(marginPct(p))}`}>
                          {(marginPct(p) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                    <p className="pt-2 text-xs text-foreground/50">
                      Considera subir el precio o bajar el costo de estos productos.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">
                    ¡Bien! Todos tus productos tienen un margen sano (20% o más).
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Catálogo */}
        <section className="animate-reveal [animation-delay:200ms]">
          <div className="mb-4 flex items-end justify-between px-2">
            <h2 className="font-serif text-2xl italic">Tu catálogo</h2>
            <p className="text-sm text-foreground/60">{products.length} productos</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Form nuevo producto */}
            <form
              onSubmit={addProduct}
              className="rounded-3xl bg-secondary p-6 ring-1 ring-black/5"
            >
              <h3 className="mb-4 font-bold">Agregar producto</h3>
              <input
                value={nName}
                onChange={(e) => setNName(e.target.value)}
                placeholder="Nombre del producto"
                className="mb-3 w-full rounded-lg bg-card px-4 py-2.5 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
              />
              <div className="mb-3 grid grid-cols-2 gap-3">
                <input
                  inputMode="decimal"
                  value={nCost}
                  onChange={(e) => setNCost(e.target.value.replace(",", "."))}
                  placeholder="Costo Bs"
                  className="w-full rounded-lg bg-card px-4 py-2.5 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
                />
                <input
                  inputMode="decimal"
                  value={nPrice}
                  onChange={(e) => setNPrice(e.target.value.replace(",", "."))}
                  placeholder="Precio Bs"
                  className="w-full rounded-lg bg-card px-4 py-2.5 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                Agregar al catálogo
              </button>
            </form>

            {/* Lista */}
            <div className="lg:col-span-2">
              <div className="space-y-px overflow-hidden rounded-2xl ring-1 ring-black/5">
                {products.map((p) => {
                  const m = marginPct(p);
                  return (
                    <div
                      key={p.id}
                      className="group flex items-center justify-between bg-card p-4 transition-colors hover:bg-secondary"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{p.name}</p>
                        <p className="text-xs text-foreground/40">
                          Costo {formatBs(p.cost)} · Precio {formatBs(p.price)} · Ganas{" "}
                          {formatBs(p.price - p.cost)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${bgForMargin(m)}`}
                        >
                          {(m * 100).toFixed(0)}% margen
                        </span>
                        <button
                          onClick={() => remove(p.id)}
                          className="rounded-lg p-2 text-foreground/30 opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <div className="bg-card p-8 text-center text-sm text-foreground/50">
                    Aún no tienes productos en tu catálogo.
                  </div>
                )}
              </div>
              <p className="mt-3 px-2 text-xs text-foreground/50">
                <span className="font-bold text-success">Verde</span> = margen sano (≥40%) ·{" "}
                <span className="font-bold text-warning-foreground">Ámbar</span> = ajustado ·{" "}
                <span className="font-bold text-danger">Rojo</span> = margen bajo (menor a 20%)
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
