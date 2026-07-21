import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConceptPopover } from "@/components/ConceptPopover";
import { listMovements } from "@/lib/movements.server";
import type { Movement } from "@/lib/storage";
import { balance, calcMonthly, formatBs, healthStatus, nextTaxDue, IVA_RATE } from "@/lib/tax";
import { profitAndLoss, type PnL } from "@/lib/analysis";
import { gestionRange, SECTOR_INFO, DEFAULT_SECTOR } from "@/lib/sectors";
import { CONCEPTS } from "@/lib/concepts";

export const Route = createFileRoute("/negocio/$businessId/")({
  head: () => ({
    meta: [
      { title: "Panel — ContadorAmigo" },
      {
        name: "description",
        content:
          "Panel visual con saldo, ingresos, gastos, utilidad, impuestos y salud financiera de tu emprendimiento.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { businessId } = Route.useParams();
  const { business } = useLoaderData({ from: "/negocio/$businessId" });
  const [movs, setMovs] = useState<Movement[]>([]);
  const [conceptIdx, setConceptIdx] = useState(0);

  useEffect(() => {
    listMovements({ data: businessId }).then(setMovs);
    setConceptIdx(Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % CONCEPTS.length);
  }, [businessId]);

  const summary = useMemo(() => calcMonthly(movs), [movs]);
  const prevSummary = useMemo(() => {
    const now = new Date();
    return calcMonthly(movs, new Date(now.getFullYear(), now.getMonth() - 1, 15));
  }, [movs]);
  const delta = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : cur < 0 ? -100 : 0) : ((cur - prev) / Math.abs(prev)) * 100;
  const bal = useMemo(() => balance(movs), [movs]);
  const health = useMemo(() => healthStatus(summary), [summary]);
  const due = useMemo(() => nextTaxDue(business.nit ?? ""), [business.nit]);
  const concept = CONCEPTS[conceptIdx];

  const weekly = useMemo(() => buildWeekly(movs), [movs]);
  const pnlMonth = useMemo(() => profitAndLoss(movs, "mes"), [movs]);
  const sector = business.sector ?? DEFAULT_SECTOR;
  const gestion = useMemo(() => gestionRange(sector), [sector]);

  const healthBars = {
    verde: [true, false, false],
    amarillo: [true, true, false],
    rojo: [true, true, true],
  }[health.level];

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4 sm:gap-8 sm:p-6">
      <div className="col-span-12 space-y-6 sm:space-y-8 lg:col-span-8">
        {/* Hero */}
        <section className="animate-reveal">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-card p-5 ring-1 ring-black/5 sm:p-8 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-sm font-medium uppercase tracking-wider text-foreground/50">
                Saldo Disponible
              </p>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
                {formatBs(bal).split(",")[0]}
                <span className="text-foreground/30">,{formatBs(bal).split(",")[1] ?? "00"}</span>
              </h1>
              <p className="mt-2 text-sm text-foreground/60">{health.description}</p>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="mb-2 font-serif text-xs italic text-primary">
                Próximo vencimiento: {due.day} de cada mes
              </span>
              <div className="flex gap-1">
                <div className={`h-12 w-3 rounded-full ${healthBars[0] ? "bg-success" : "bg-success/20"}`} />
                <div className={`h-12 w-3 rounded-full ${healthBars[1] ? "bg-warning" : "bg-warning/20"}`} />
                <div className={`h-12 w-3 rounded-full ${healthBars[2] ? "bg-danger" : "bg-danger/20"}`} />
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div className="animate-reveal [animation-delay:100ms]">
          <p className="mb-2 px-1 text-xs font-medium text-foreground/40">
            Este mes · comparado con el mes anterior
          </p>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi
              label="Ingresos"
              value={formatBs(summary.ingresos)}
              tone="success"
              conceptKey="flujo-caja"
              delta={delta(summary.ingresos, prevSummary.ingresos)}
              goodWhenUp
            />
            <Kpi
              label="Gastos"
              value={formatBs(summary.gastos)}
              tone="danger"
              conceptKey="flujo-caja"
              delta={delta(summary.gastos, prevSummary.gastos)}
              goodWhenUp={false}
            />
            <Kpi
              label="Utilidad"
              value={formatBs(summary.utilidad)}
              tone={summary.utilidad >= 0 ? "neutral" : "danger"}
              conceptKey="utilidad"
              delta={delta(summary.utilidad, prevSummary.utilidad)}
              goodWhenUp
            />
            <Kpi
              label="Impuestos"
              value={formatBs(summary.totalImpuestos)}
              tone="warning"
              conceptKey="iva"
              delta={delta(summary.totalImpuestos, prevSummary.totalImpuestos)}
              goodWhenUp={false}
            />
          </section>
        </div>

        <BreakdownCard pnl={pnlMonth} />

        {/* Chart */}
        <section className="animate-reveal [animation-delay:200ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-bold">Flujo de Caja — últimas semanas</h3>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-success" /> Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-danger" /> Gastos
              </span>
            </div>
          </div>
          <div className="flex h-40 items-end justify-between gap-3">
            {weekly.map((w, i) => {
              const max = Math.max(...weekly.flatMap((x) => [x.ingresos, x.gastos]), 1);
              return (
                <div key={i} className="flex w-full flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end justify-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-success/60 transition-colors hover:bg-success"
                      style={{ height: `${(w.ingresos / max) * 100}%` }}
                      title={`Ingresos: ${formatBs(w.ingresos)}`}
                    />
                    <div
                      className="w-full rounded-t-md bg-danger/60 transition-colors hover:bg-danger"
                      style={{ height: `${(w.gastos / max) * 100}%` }}
                      title={`Gastos: ${formatBs(w.gastos)}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-foreground/40">{w.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Movements */}
        <section className="animate-reveal [animation-delay:300ms]">
          <div className="mb-4 flex items-end justify-between px-2">
            <h3 className="text-lg font-bold">Últimos Movimientos</h3>
            <Link
              to="/negocio/$businessId/movimientos"
              params={{ businessId }}
              className="border-b border-primary/20 text-sm font-medium text-primary"
            >
              Ver historial
            </Link>
          </div>
          <div className="space-y-px overflow-hidden rounded-2xl ring-1 ring-black/5">
            {movs.slice(0, 5).map((m) => {
              const gross = m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;
              const iva = m.hasInvoice ? m.amountNet * IVA_RATE : 0;
              const isIn = m.type === "ingreso";
              return (
                <div key={m.id} className="flex items-center justify-between bg-card p-4 transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-4">
                    <div
                      className={`grid size-10 place-items-center rounded-full text-sm font-bold ${
                        isIn ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {isIn ? "+" : "−"}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{m.concept}</p>
                      <p className="text-xs text-foreground/40">
                        {new Date(m.date).toLocaleDateString("es-BO", { day: "numeric", month: "short" })}{" "}
                        · {m.category}
                        {m.hasInvoice && " · Con factura"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isIn ? "text-success" : "text-danger"}`}>
                      {isIn ? "+ " : "− "}
                      {formatBs(gross)}
                    </p>
                    {iva > 0 && <p className="text-[10px] text-foreground/40">IVA: {formatBs(iva)} (13%)</p>}
                  </div>
                </div>
              );
            })}
            {movs.length === 0 && (
              <div className="bg-card p-8 text-center text-sm text-foreground/50">
                Aún no hay movimientos. Registra tu primera venta o gasto.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="col-span-12 space-y-6 lg:col-span-4">
        <section className="animate-reveal [animation-delay:400ms] rounded-3xl bg-primary p-6 text-primary-foreground">
          <h3 className="mb-2 font-serif text-xl italic">Registra un movimiento</h3>
          <p className="mb-5 text-sm text-primary-foreground/70">
            Añade una venta o un gasto en segundos. Con o sin factura.
          </p>
          <Link
            to="/negocio/$businessId/movimientos"
            params={{ businessId }}
            className="block w-full rounded-xl bg-background py-3 text-center font-bold text-primary shadow-xl shadow-black/10 transition-transform hover:scale-[1.01]"
          >
            + Nuevo Movimiento
          </Link>
        </section>

        <section className="animate-reveal [animation-delay:500ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            Calendario Tributario
            <span className="size-2 rounded-full bg-warning" />
          </h3>
          <div className="space-y-4">
            <div className="relative border-l-2 border-primary/30 pl-4">
              <div className="absolute -left-[5px] top-1 size-2 rounded-full bg-primary" />
              <p className="text-xs font-bold uppercase text-foreground/40">
                {due.date.toLocaleDateString("es-BO", { day: "numeric", month: "long" })}
              </p>
              <p className="text-sm font-bold">IVA & IT mensual</p>
              <p className="text-xs text-foreground/60">
                Vencimiento según NIT terminación {(business.nit || "0").slice(-1) || "—"}
              </p>
            </div>
            <div className="relative border-l-2 border-primary/10 pl-4 opacity-60">
              <div className="absolute -left-[5px] top-1 size-2 rounded-full bg-stone-300" />
              <p className="text-xs font-bold uppercase text-foreground/40">
                {gestion.dueDate.toLocaleDateString("es-BO", { day: "numeric", month: "long" })}
              </p>
              <p className="text-sm font-bold">IUE — Cierre de Gestión</p>
              <p className="text-xs text-foreground/60">
                {SECTOR_INFO[sector].label} · cierra el{" "}
                {gestion.end.toLocaleDateString("es-BO", { day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </section>

        <section className="animate-reveal [animation-delay:600ms] rounded-3xl border-2 border-dashed border-border bg-secondary p-6">
          <div className="mb-4 flex justify-center">
            <div className="grid size-20 place-items-center rounded-2xl bg-card font-serif text-3xl italic text-primary ring-1 ring-black/5">
              {concept.term.split(" ")[0].slice(0, 3)}
            </div>
          </div>
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
            Concepto del día
          </p>
          <h4 className="mb-3 text-center font-serif text-xl italic">{concept.term}</h4>
          <p className="text-pretty text-center text-sm leading-relaxed text-foreground/70">{concept.full}</p>
          {concept.example && (
            <p className="mt-3 rounded-lg bg-card p-3 text-center text-xs text-foreground/70">
              <span className="font-bold">Ejemplo: </span>
              {concept.example}
            </p>
          )}
          <div className="mt-4 text-center">
            <Link
              to="/negocio/$businessId/aprender"
              params={{ businessId }}
              className="text-xs font-bold uppercase tracking-widest text-primary"
            >
              Ver más conceptos →
            </Link>
          </div>
        </section>
      </aside>
    </main>
  );
}

function Kpi({
  label,
  value,
  tone,
  conceptKey,
  delta,
  goodWhenUp,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning" | "neutral";
  conceptKey: string;
  delta?: number;
  goodWhenUp?: boolean;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-foreground";

  let deltaEl = null;
  if (delta !== undefined) {
    const flat = Math.abs(delta) < 0.5;
    const up = delta >= 0;
    const good = flat ? null : up === goodWhenUp;
    const cls = flat ? "bg-secondary text-foreground/50" : good ? "bg-success/10 text-success" : "bg-danger/10 text-danger";
    deltaEl = (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`} title="Variación respecto al mes anterior">
        {flat ? "=" : up ? "▲" : "▼"} {flat ? "" : `${Math.abs(delta).toFixed(0)}%`}
      </span>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-black/5">
      <p className="mb-2 text-xs font-bold uppercase text-foreground/40">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <ConceptPopover conceptKey={conceptKey} />
        {deltaEl}
      </div>
    </div>
  );
}

function BreakdownCard({ pnl }: { pnl: PnL }) {
  const total = pnl.ingresos;
  const segments = [
    { label: "Costo de ventas", hint: "insumos y mercadería", value: pnl.costoVentas, color: "bg-warning" },
    { label: "Gastos operativos", hint: "alquiler, sueldos, marketing…", value: pnl.gastosOperativos, color: "bg-danger" },
    { label: "Inversión", hint: "activos fijos comprados", value: pnl.inversion, color: "bg-accent-foreground/40" },
    { label: "Impuestos", hint: "IVA + IT del mes", value: pnl.impuestos, color: "bg-primary" },
    { label: "Utilidad neta", hint: "lo que te queda", value: Math.max(0, pnl.utilidadNeta), color: "bg-success" },
  ];

  if (total <= 0) {
    return (
      <section className="animate-reveal [animation-delay:150ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
        <h3 className="mb-1 font-bold">¿En qué se va cada Bs que vendes?</h3>
        <p className="text-sm text-foreground/50">
          Registra ventas este mes para ver aquí cómo se reparte tu dinero.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-reveal [animation-delay:150ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-bold">¿En qué se va cada Bs que vendes?</h3>
        <ConceptPopover conceptKey="utilidad" />
      </div>
      <p className="mb-6 text-sm text-foreground/50">
        De cada Bs 100 que vendiste este mes, así se reparte entre costos, gastos, impuestos y tu
        ganancia.
      </p>

      <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              className={`h-full ${s.color} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${formatBs(s.value)} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {segments.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div key={s.label}>
              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${s.color}`} />
                <span className="text-xs font-bold text-foreground/70">{s.label}</span>
              </div>
              <p className="mt-1 font-serif text-lg italic">{pct.toFixed(0)}%</p>
              <p className="text-[11px] text-foreground/40">
                {formatBs(s.value)} · {s.hint}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function buildWeekly(movs: Movement[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now);
    start.setDate(now.getDate() - (5 - i) * 7);
    return { start, ingresos: 0, gastos: 0, label: `S${i + 1}` };
  });
  for (const m of movs) {
    const d = new Date(m.date);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (d >= buckets[i].start) {
        const gross = m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;
        if (m.type === "ingreso") buckets[i].ingresos += gross;
        else buckets[i].gastos += gross;
        break;
      }
    }
  }
  return buckets;
}
