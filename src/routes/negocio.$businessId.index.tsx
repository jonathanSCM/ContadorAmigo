import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConceptPopover } from "@/components/ConceptPopover";
import { listMovements } from "@/lib/movements.server";
import { cachedCall } from "@/lib/query-cache";
import type { Movement } from "@/lib/storage";
import { balance, calcMonthly, formatBs, healthStatus, nextTaxDue, IVA_RATE } from "@/lib/tax";
import { profitAndLoss, type PnL } from "@/lib/analysis";
import { gestionRange, SECTOR_INFO, DEFAULT_SECTOR } from "@/lib/sectors";
import { CONCEPTS } from "@/lib/concepts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Coins,
  Landmark,
  Package,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

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
    cachedCall(`movements:${businessId}`, () => listMovements({ data: businessId })).then(setMovs);
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

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4 sm:gap-8 sm:p-6">
      <div className="col-span-12 space-y-6 sm:space-y-8 lg:col-span-8">
        {/* Hero */}
        <section className="animate-reveal">
          <div
            className="relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:p-8"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 left-10 size-56 rounded-full bg-black/10 blur-2xl"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  <Wallet className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-75">Saldo disponible</p>
                  <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
                    {formatBs(bal).split(",")[0]}
                    <span className="opacity-50">,{formatBs(bal).split(",")[1] ?? "00"}</span>
                  </h1>
                </div>
              </div>
              <HealthBadge health={health} />
            </div>
            <p className="relative mt-4 max-w-md text-sm leading-relaxed opacity-90">{health.description}</p>
            <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
              <Calendar className="size-3.5" /> Próximo vencimiento: día {due.day} de cada mes
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
              icon={TrendingUp}
              conceptKey="flujo-caja"
              delta={delta(summary.ingresos, prevSummary.ingresos)}
              goodWhenUp
            />
            <Kpi
              label="Gastos"
              value={formatBs(summary.gastos)}
              tone="danger"
              icon={TrendingDown}
              conceptKey="flujo-caja"
              delta={delta(summary.gastos, prevSummary.gastos)}
              goodWhenUp={false}
            />
            <Kpi
              label="Utilidad"
              value={formatBs(summary.utilidad)}
              tone={summary.utilidad >= 0 ? "primary" : "danger"}
              icon={Coins}
              conceptKey="utilidad"
              delta={delta(summary.utilidad, prevSummary.utilidad)}
              goodWhenUp
            />
            <Kpi
              label="Impuestos"
              value={formatBs(summary.totalImpuestos)}
              tone="warning"
              icon={Landmark}
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
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success shadow-[0_0_0_3px_var(--color-success)]/20" /> Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-danger shadow-[0_0_0_3px_var(--color-danger)]/20" /> Gastos
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
                      className="bar-grow w-full rounded-t-md transition-opacity hover:opacity-80"
                      style={{
                        height: `${(w.ingresos / max) * 100}%`,
                        background: "linear-gradient(180deg, var(--color-success), color-mix(in oklch, var(--color-success), transparent 45%))",
                      }}
                      title={`Ingresos: ${formatBs(w.ingresos)}`}
                    />
                    <div
                      className="bar-grow w-full rounded-t-md transition-opacity hover:opacity-80"
                      style={{
                        height: `${(w.gastos / max) * 100}%`,
                        background: "linear-gradient(180deg, var(--color-danger), color-mix(in oklch, var(--color-danger), transparent 45%))",
                      }}
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
                      className={`grid size-10 place-items-center rounded-full text-sm font-bold ring-1 ${
                        isIn
                          ? "bg-success/10 text-success ring-success/20"
                          : "bg-danger/10 text-danger ring-danger/20"
                      }`}
                    >
                      {isIn ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
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
        <section
          className="animate-reveal [animation-delay:400ms] relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-lg shadow-primary/20"
          style={{ background: "linear-gradient(160deg, var(--color-primary), color-mix(in oklch, var(--color-primary), var(--color-accent) 45%))" }}
        >
          <h3 className="mb-2 font-serif text-xl italic">Registra un movimiento</h3>
          <p className="mb-5 text-sm opacity-80">Añade una venta o un gasto en segundos. Con o sin factura.</p>
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
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-primary/8 p-3 ring-1 ring-primary/15">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Receipt className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  {due.date.toLocaleDateString("es-BO", { day: "numeric", month: "long" })}
                </p>
                <p className="text-sm font-bold">IVA &amp; IT mensual</p>
                <p className="text-xs text-foreground/60">
                  Vencimiento según NIT terminación {(business.nit || "0").slice(-1) || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-secondary p-3 opacity-80">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/10 text-foreground/60">
                <Landmark className="size-4.5" />
              </div>
              <div>
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
          </div>
        </section>

        <section className="animate-reveal [animation-delay:600ms] rounded-3xl border-2 border-dashed border-border bg-secondary p-6">
          <div className="mb-4 flex justify-center">
            <div
              className="grid size-20 place-items-center rounded-2xl font-serif text-3xl italic text-primary-foreground ring-1 ring-black/5"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
            >
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

function HealthBadge({ health }: { health: ReturnType<typeof healthStatus> }) {
  const cfg = {
    verde: { Icon: CheckCircle2, text: "text-success" },
    amarillo: { Icon: AlertTriangle, text: "text-warning-foreground" },
    rojo: { Icon: XCircle, text: "text-danger" },
  }[health.level];
  const { Icon, text } = cfg;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-4 ring-white/25">
      <Icon className={`size-8 ${text}`} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Salud financiera</p>
        <p className={`font-serif text-lg italic ${text}`}>{health.label}</p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon: Icon,
  conceptKey,
  delta,
  goodWhenUp,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning" | "primary";
  icon: typeof TrendingUp;
  conceptKey: string;
  delta?: number;
  goodWhenUp?: boolean;
}) {
  const styles = {
    success: { bg: "bg-success/10", ring: "ring-success/15", text: "text-success", badge: "bg-success text-success-foreground" },
    danger: { bg: "bg-danger/10", ring: "ring-danger/15", text: "text-danger", badge: "bg-danger text-danger-foreground" },
    warning: { bg: "bg-warning/15", ring: "ring-warning/20", text: "text-warning-foreground", badge: "bg-warning text-warning-foreground" },
    primary: { bg: "bg-primary/10", ring: "ring-primary/15", text: "text-primary", badge: "bg-primary text-primary-foreground" },
  }[tone];

  let deltaEl = null;
  if (delta !== undefined) {
    const flat = Math.abs(delta) < 0.5;
    const up = delta >= 0;
    const good = flat ? null : up === goodWhenUp;
    const cls = flat ? "bg-card text-foreground/50" : good ? "bg-success/15 text-success" : "bg-danger/15 text-danger";
    deltaEl = (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}
        title="Variación respecto al mes anterior"
      >
        {flat ? "=" : up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {flat ? "" : `${Math.abs(delta).toFixed(0)}%`}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl ${styles.bg} p-5 ring-1 ${styles.ring} transition-transform hover:-translate-y-0.5`}>
      <div className="mb-3 flex items-center justify-between">
        <div className={`grid size-9 place-items-center rounded-xl ${styles.badge}`}>
          <Icon className="size-4.5" />
        </div>
        {deltaEl}
      </div>
      <p className="mb-1 text-xs font-bold uppercase text-foreground/40">{label}</p>
      <p className={`text-xl font-extrabold ${styles.text}`}>{value}</p>
      <div className="mt-2">
        <ConceptPopover conceptKey={conceptKey} />
      </div>
    </div>
  );
}

const SEGMENT_ICONS = [Package, Receipt, Coins, Landmark, PiggyBank] as const;

function BreakdownCard({ pnl }: { pnl: PnL }) {
  const total = pnl.ingresos;
  const segments = [
    { label: "Costo de ventas", hint: "insumos y mercadería", value: pnl.costoVentas, color: "var(--color-warning)", dot: "bg-warning" },
    { label: "Gastos operativos", hint: "alquiler, sueldos, marketing…", value: pnl.gastosOperativos, color: "var(--color-danger)", dot: "bg-danger" },
    { label: "Inversión", hint: "activos fijos comprados", value: pnl.inversion, color: "var(--color-accent)", dot: "bg-accent" },
    { label: "Impuestos", hint: "IVA + IT del mes", value: pnl.impuestos, color: "var(--color-primary)", dot: "bg-primary" },
    { label: "Utilidad neta", hint: "lo que te queda", value: Math.max(0, pnl.utilidadNeta), color: "var(--color-success)", dot: "bg-success" },
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

  let cursor = 0;
  const stops: string[] = [];
  for (const s of segments) {
    const pct = Math.max(0, (s.value / total) * 100);
    if (pct <= 0) continue;
    const start = cursor;
    const end = cursor + pct;
    stops.push(`${s.color} ${start}% ${end}%`);
    cursor = end;
  }
  if (cursor < 100) stops.push(`var(--color-border) ${cursor}% 100%`);
  const conic = `conic-gradient(${stops.join(", ")})`;
  const utilidadPct = Math.round((Math.max(0, pnl.utilidadNeta) / total) * 100);

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

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div
          className="animate-pop relative size-40 shrink-0 rounded-full shadow-inner"
          style={{ background: conic }}
        >
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Utilidad</span>
            <span className="font-serif text-3xl italic text-success">{utilidadPct}%</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {segments.map((s, i) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            const Icon = SEGMENT_ICONS[i];
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${s.dot}/15`}>
                  <Icon className="size-4" style={{ color: s.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-bold text-foreground/80">{s.label}</span>
                    <span className="font-serif text-sm italic">{pct.toFixed(0)}%</span>
                  </div>
                  <p className="truncate text-[11px] text-foreground/40">
                    {formatBs(s.value)} · {s.hint}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
