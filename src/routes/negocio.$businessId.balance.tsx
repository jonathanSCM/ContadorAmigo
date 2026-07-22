import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConceptPopover } from "@/components/ConceptPopover";
import { formatBs } from "@/lib/tax";
import { listMovements } from "@/lib/movements.server";
import { cachedCall, invalidateCache } from "@/lib/query-cache";
import type { Movement } from "@/lib/storage";
import {
  addBalanceItem,
  deleteBalanceItem,
  listBalanceItems,
  type BalanceCategory,
  type BalanceItem,
} from "@/lib/balance.server";
import { balanceSheet } from "@/lib/balance";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/balance")({
  head: () => ({
    meta: [
      { title: "Balance General — ContadorAmigo" },
      {
        name: "description",
        content: "Tu Estado de Situación Financiera: qué tienes, qué debes y qué es realmente tuyo.",
      },
    ],
  }),
  component: Balance,
});

const SECTIONS: { category: BalanceCategory; title: string; hint: string; placeholder: string }[] = [
  { category: "activo_corriente", title: "Activo corriente", hint: "Caja, banco, inventario", placeholder: "Ej: Caja" },
  { category: "activo_fijo", title: "Activo fijo", hint: "Equipos, muebles, vehículos", placeholder: "Ej: Equipos" },
  { category: "pasivo", title: "Pasivos", hint: "Préstamos, cuentas por pagar", placeholder: "Ej: Préstamo BNB" },
  { category: "capital_propio", title: "Capital propio", hint: "Lo que pusiste al iniciar", placeholder: "Ej: Capital inicial" },
];

function Balance() {
  const { businessId } = Route.useParams();
  const [items, setItems] = useState<BalanceItem[]>([]);
  const [movs, setMovs] = useState<Movement[]>([]);

  const refresh = () => {
    invalidateCache(`balanceItems:${businessId}`);
    return listBalanceItems({ data: businessId }).then(setItems);
  };

  useEffect(() => {
    cachedCall(`balanceItems:${businessId}`, () => listBalanceItems({ data: businessId })).then(setItems);
    cachedCall(`movements:${businessId}`, () => listMovements({ data: businessId })).then(setMovs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const sheet = useMemo(() => balanceSheet(items, movs), [items, movs]);
  const cuadra = Math.abs(sheet.diferencia) < 0.5;

  const remove = async (id: string) => {
    await deleteBalanceItem({ data: { id, businessId } });
    await refresh();
  };

  const byCategory = (cat: BalanceCategory) => items.filter((i) => i.category === cat);

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <header className="animate-reveal">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-4xl italic">Balance General</h1>
          <ConceptPopover conceptKey="balance-general" />
        </div>
        <p className="mt-2 max-w-2xl text-foreground/60">
          Una foto de tu negocio hoy: qué tienes (Activos), qué debes (Pasivos) y qué es realmente
          tuyo (Patrimonio). Actualízalo cuando cambien tus bienes o deudas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activos */}
        <div className="space-y-6">
          <h2 className="px-1 font-serif text-2xl italic">Activos</h2>
          {SECTIONS.filter((s) => s.category === "activo_corriente" || s.category === "activo_fijo").map(
            (s) => (
              <BalanceSection
                key={s.category}
                section={s}
                items={byCategory(s.category)}
                businessId={businessId}
                onChange={refresh}
                onRemove={remove}
              />
            ),
          )}
          <div className="rounded-2xl bg-primary/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Activo total</p>
            <p className="mt-1 font-serif text-2xl italic">{formatBs(sheet.activoTotal)}</p>
          </div>
        </div>

        {/* Pasivos + Patrimonio */}
        <div className="space-y-6">
          <h2 className="px-1 font-serif text-2xl italic">Pasivos y Patrimonio</h2>
          {SECTIONS.filter((s) => s.category === "pasivo").map((s) => (
            <BalanceSection
              key={s.category}
              section={s}
              items={byCategory(s.category)}
              businessId={businessId}
              onChange={refresh}
              onRemove={remove}
            />
          ))}
          {SECTIONS.filter((s) => s.category === "capital_propio").map((s) => (
            <BalanceSection
              key={s.category}
              section={s}
              items={byCategory(s.category)}
              businessId={businessId}
              onChange={refresh}
              onRemove={remove}
              extraRow={{ label: "Utilidades acumuladas (calculado)", value: sheet.utilidadesAcumuladas }}
            />
          ))}
          <div className="rounded-2xl bg-primary/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Pasivo + Patrimonio
            </p>
            <p className="mt-1 font-serif text-2xl italic">
              {formatBs(sheet.pasivoTotal + sheet.patrimonioTotal)}
            </p>
          </div>
        </div>
      </div>

      <section className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MiniStat label="Activo total" value={formatBs(sheet.activoTotal)} />
          <MiniStat label="Pasivo total" value={formatBs(sheet.pasivoTotal)} />
          <MiniStat label="Patrimonio total" value={formatBs(sheet.patrimonioTotal)} />
        </div>
        <div
          className={`mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm ${
            cuadra ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {cuadra ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          )}
          <p>
            {cuadra
              ? "Tu balance cuadra: Activo = Pasivo + Patrimonio."
              : `Tu balance no cuadra por ${formatBs(Math.abs(sheet.diferencia))}. Este es un resumen simplificado (no de partida doble) — revisa que registraste todos tus bienes y deudas.`}
          </p>
        </div>
      </section>
    </main>
  );
}

function BalanceSection({
  section,
  items,
  businessId,
  onChange,
  onRemove,
  extraRow,
}: {
  section: { category: BalanceCategory; title: string; hint: string; placeholder: string };
  items: BalanceItem[];
  businessId: string;
  onChange: () => void;
  onRemove: (id: string) => void;
  extraRow?: { label: string; value: number };
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const total = items.reduce((s, i) => s + i.amount, 0) + (extraRow?.value ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) {
      toast.error("Completa nombre y monto válido");
      return;
    }
    await addBalanceItem({ data: { businessId, category: section.category, name: name.trim(), amount: amt } });
    onChange();
    setName("");
    setAmount("");
  };

  return (
    <section className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-bold">{section.title}</h3>
        <span className="font-serif text-lg italic">{formatBs(total)}</span>
      </div>
      <p className="mb-4 text-xs text-foreground/50">{section.hint}</p>

      <div className="space-y-px overflow-hidden rounded-xl ring-1 ring-black/5">
        {items.map((i) => (
          <div key={i.id} className="group flex items-center justify-between bg-secondary p-3">
            <span className="text-sm font-medium">{i.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{formatBs(i.amount)}</span>
              <button
                onClick={() => onRemove(i.id)}
                className="rounded-lg p-1.5 text-foreground/30 opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                aria-label="Eliminar"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {extraRow && (
          <div className="flex items-center justify-between bg-secondary p-3 opacity-80">
            <span className="text-sm font-medium">{extraRow.label}</span>
            <span className="text-sm font-bold">{formatBs(extraRow.value)}</span>
          </div>
        )}
        {items.length === 0 && !extraRow && (
          <div className="bg-secondary p-4 text-center text-xs text-foreground/50">Sin ítems aún.</div>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={section.placeholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
        />
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(",", "."))}
          placeholder="Bs"
          className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Agregar
        </button>
      </form>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="mt-1 font-serif text-xl italic">{value}</p>
    </div>
  );
}
