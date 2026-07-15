import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConceptPopover } from "@/components/ConceptPopover";
import { formatBs, IVA_RATE } from "@/lib/tax";
import { Plus, Trash2 } from "lucide-react";

interface Line {
  id: string;
  detail: string;
  qty: number;
  price: number;
}

export const Route = createFileRoute("/facturacion")({
  head: () => ({
    meta: [
      { title: "Facturación — ContadorAmigo" },
      {
        name: "description",
        content:
          "Simulador de facturas con cálculo automático de IVA 13% (débito fiscal) para emprendedores en Bolivia.",
      },
    ],
  }),
  component: Facturacion,
});

function Facturacion() {
  const [client, setClient] = useState("");
  const [clientNit, setClientNit] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { id: crypto.randomUUID(), detail: "Producto o servicio", qty: 1, price: 100 },
  ]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const iva = subtotal * IVA_RATE;
    return { subtotal, iva, total: subtotal + iva };
  }, [lines]);

  const addLine = () =>
    setLines([...lines, { id: crypto.randomUUID(), detail: "", qty: 1, price: 0 }]);
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));
  const update = (id: string, patch: Partial<Line>) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4 sm:gap-8 sm:p-6">
        <section className="col-span-12 lg:col-span-8 animate-reveal">
          <header className="mb-6">
            <h1 className="font-serif text-4xl italic">Simulador de Factura</h1>
            <p className="mt-1 text-sm text-foreground/60">
              El IVA en Bolivia es del <strong>13%</strong>. Se calcula sobre el subtotal y forma
              parte del total facturado. <ConceptPopover conceptKey="iva" />
            </p>
          </header>

          <div className="rounded-3xl bg-card p-8 ring-1 ring-black/5">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                  Razón Social del Cliente
                </label>
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nombre o empresa"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                  NIT / CI del cliente
                </label>
                <input
                  value={clientNit}
                  onChange={(e) => setClientNit(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-3 hidden gap-2 border-b border-border pb-2 text-[10px] font-bold uppercase tracking-widest text-foreground/50 sm:grid sm:grid-cols-12">
              <div className="col-span-6">Detalle</div>
              <div className="col-span-2 text-right">Cant.</div>
              <div className="col-span-3 text-right">P. Unit. (Bs)</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12"
                >
                  <input
                    value={l.detail}
                    onChange={(e) => update(l.id, { detail: e.target.value })}
                    placeholder="Detalle del producto o servicio"
                    className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-6"
                  />
                  <input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    value={l.qty}
                    onChange={(e) => update(l.id, { qty: parseFloat(e.target.value) || 0 })}
                    placeholder="Cant."
                    className="col-span-1 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm focus:border-primary focus:outline-none sm:col-span-2"
                  />
                  <input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    value={l.price}
                    onChange={(e) => update(l.id, { price: parseFloat(e.target.value) || 0 })}
                    placeholder="P. Unit."
                    className="col-span-1 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm font-bold focus:border-primary focus:outline-none sm:col-span-3"
                  />
                  <button
                    onClick={() => removeLine(l.id)}
                    className="col-span-2 grid place-items-center rounded-lg border border-dashed border-border p-2 text-foreground/30 hover:bg-danger/10 hover:text-danger sm:col-span-1 sm:border-none"
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLine}
              className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:border-primary hover:text-primary"
            >
              <Plus className="size-3" /> Añadir línea
            </button>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 animate-reveal [animation-delay:100ms] space-y-6">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Resumen de la factura
            </p>
            <div className="space-y-3 border-b border-border pb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Subtotal</span>
                <span className="font-bold">{formatBs(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span className="flex items-center gap-2">
                  IVA 13% <ConceptPopover conceptKey="debito-fiscal" label="débito" />
                </span>
                <span className="font-bold">{formatBs(totals.iva)}</span>
              </div>
            </div>
            <div className="pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                Total a cobrar
              </p>
              <p className="mt-1 font-serif text-4xl italic text-primary">
                {formatBs(totals.total)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-warning/10 p-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-warning-foreground/70">
              Recuerda
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">
              El <strong>IVA cobrado</strong> no es tuyo: es dinero que retienes para pagar al SIN
              al mes siguiente. Guarda al menos <strong>{formatBs(totals.iva)}</strong> de esta
              factura.
            </p>
          </div>

          {client && (
            <div className="rounded-3xl border-2 border-dashed border-border bg-secondary p-6 text-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                Vista previa
              </p>
              <p className="font-bold">{client}</p>
              <p className="text-xs text-foreground/60">NIT/CI: {clientNit || "—"}</p>
              <p className="mt-3 text-xs text-foreground/60">
                {lines.length} concepto{lines.length !== 1 ? "s" : ""} · {formatBs(totals.total)}
              </p>
            </div>
          )}
        </aside>
      </main>
    </AppShell>
  );
}
