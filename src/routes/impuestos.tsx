import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConceptPopover } from "@/components/ConceptPopover";
import { loadMovements, loadNit, type Movement } from "@/lib/storage";
import {
  calcMonthly,
  formatBs,
  IT_RATE,
  IUE_RATE,
  IVA_RATE,
  nextTaxDue,
} from "@/lib/tax";
import { annualEstimate } from "@/lib/analysis";
import { compareRegimes, type RegimeOption } from "@/lib/regimes";

export const Route = createFileRoute("/impuestos")({
  head: () => ({
    meta: [
      { title: "Impuestos — ContadorAmigo" },
      {
        name: "description",
        content:
          "Calcula tu IVA, IT e IUE en Bolivia. Vencimientos según el último dígito de tu NIT.",
      },
    ],
  }),
  component: Impuestos,
});

function Impuestos() {
  const [movs, setMovs] = useState<Movement[]>([]);
  const [nit, setNit] = useState("");
  const [capital, setCapital] = useState("22000");

  useEffect(() => {
    setMovs(loadMovements());
    setNit(loadNit());
  }, []);

  const s = useMemo(() => calcMonthly(movs), [movs]);
  const due = useMemo(() => nextTaxDue(nit), [nit]);
  const annual = useMemo(() => annualEstimate(movs), [movs]);
  const comparison = useMemo(
    () =>
      compareRegimes({
        ventasAnuales: annual.ventas,
        capital: parseFloat(capital) || 0,
        comprasAnuales: annual.compras,
        utilidadAnual: annual.utilidad,
      }),
    [annual, capital],
  );

  // IUE estimado: 25% de utilidad anual proyectada
  const utilidadAnualEstimada = s.utilidad * 12;
  const iueEstimado = Math.max(0, utilidadAnualEstimada) * IUE_RATE;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl space-y-8 p-6">
        <header className="animate-reveal">
          <h1 className="font-serif text-4xl italic">Tus impuestos, sin susto</h1>
          <p className="mt-2 max-w-2xl text-foreground/60">
            Estos son los tres tributos principales que debes controlar como emprendedor formal en
            Bolivia. Los cálculos se basan en tus movimientos del mes actual.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* IVA */}
          <div className="animate-reveal [animation-delay:50ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                IVA · 13%
              </span>
              <ConceptPopover conceptKey="iva" />
            </div>
            <p className="mb-1 text-xs uppercase text-foreground/50">A pagar este mes</p>
            <p className="mb-4 font-serif text-4xl italic">{formatBs(s.ivaAPagar)}</p>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Débito fiscal (ventas)" value={formatBs(s.ivaDebito)} tone="warning" />
              <Row
                label="Crédito fiscal (compras)"
                value={`− ${formatBs(s.ivaCredito)}`}
                tone="success"
              />
              <Row label="Neto a pagar" value={formatBs(s.ivaAPagar)} bold />
            </div>
            <p className="mt-4 text-xs text-foreground/50">Formulario 200 · Mensual</p>
          </div>

          {/* IT */}
          <div className="animate-reveal [animation-delay:100ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-warning/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-warning-foreground">
                IT · 3%
              </span>
              <ConceptPopover conceptKey="it" />
            </div>
            <p className="mb-1 text-xs uppercase text-foreground/50">A pagar este mes</p>
            <p className="mb-4 font-serif text-4xl italic">{formatBs(s.itAPagar)}</p>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Ingresos brutos del mes" value={formatBs(s.ingresos)} />
              <Row label={`× ${(IT_RATE * 100).toFixed(0)}%`} value={formatBs(s.itAPagar)} bold />
            </div>
            <p className="mt-4 text-xs text-foreground/50">Formulario 400 · Mensual</p>
          </div>

          {/* IUE */}
          <div className="animate-reveal [animation-delay:150ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-danger/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-danger">
                IUE · 25%
              </span>
              <ConceptPopover conceptKey="iue" />
            </div>
            <p className="mb-1 text-xs uppercase text-foreground/50">Estimado anual</p>
            <p className="mb-4 font-serif text-4xl italic">{formatBs(iueEstimado)}</p>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <Row
                label="Utilidad anual proyectada"
                value={formatBs(utilidadAnualEstimada)}
              />
              <Row
                label={`× ${(IUE_RATE * 100).toFixed(0)}%`}
                value={formatBs(iueEstimado)}
                bold
              />
            </div>
            <p className="mt-4 text-xs text-foreground/50">Formulario 500 · Anual (120 días)</p>
          </div>
        </section>

        {/* Comparador de regímenes */}
        <section className="animate-reveal [animation-delay:175ms] rounded-3xl bg-card p-8 ring-1 ring-black/5">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl italic">¿Qué régimen te conviene?</h2>
              <p className="mt-1 max-w-xl text-sm text-foreground/60">
                Comparamos los cuatro regímenes bolivianos con una estimación anual basada en tus{" "}
                {annual.mesesBase > 0 ? `${annual.mesesBase} meses registrados` : "movimientos"}.
                Ajusta tu capital para afinar el cálculo.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                Capital invertido
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-sm italic text-foreground/40">
                  Bs
                </span>
                <input
                  inputMode="decimal"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value.replace(",", "."))}
                  className="w-40 rounded-xl bg-secondary py-2.5 pl-9 pr-3 font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Ventas / año (est.)" value={formatBs(annual.ventas)} />
            <MiniStat label="Compras con factura / año" value={formatBs(annual.compras)} />
            <MiniStat label="Utilidad / año (est.)" value={formatBs(annual.utilidad)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {comparison.options.map((o) => (
              <RegimeCard key={o.id} o={o} />
            ))}
          </div>
          <p className="mt-4 text-xs text-foreground/50">
            Estimación educativa, no oficial. Los montos y condiciones los define el SIN. El régimen{" "}
            <span className="font-bold text-primary">recomendado</span> es el más conveniente entre
            los que cumples según tu tamaño.
          </p>
        </section>

        {/* Timeline */}
        <section className="animate-reveal [animation-delay:200ms] rounded-3xl bg-card p-8 ring-1 ring-black/5">
          <h2 className="mb-6 font-serif text-2xl italic">Calendario de vencimientos</h2>
          <div className="relative border-l-2 border-border pl-8">
            <TimelineItem
              badge={`Día ${due.day}`}
              date={due.date.toLocaleDateString("es-BO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              title="IVA y IT del mes"
              body={`Vencimiento según tu NIT (${nit || "sin definir"}). Presenta Formularios 200 y 400.`}
              color="primary"
            />
            <TimelineItem
              badge="Trimestral"
              date="Marzo · Junio · Septiembre · Diciembre"
              title="Revisión de reservas"
              body="Momento sugerido para verificar que estás separando el IVA cobrado y el IT proyectado."
              color="warning"
            />
            <TimelineItem
              badge="Anual"
              date="120 días tras cierre de gestión"
              title="IUE — Impuesto sobre Utilidades"
              body="Cierre contable y pago del 25% sobre utilidades netas. Se puede compensar con IT del año siguiente."
              color="danger"
            />
          </div>
        </section>

        <section className="animate-reveal [animation-delay:250ms] grid grid-cols-1 gap-4 rounded-3xl border-2 border-dashed border-border bg-secondary p-8 md:grid-cols-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Reserva sugerida
            </p>
            <p className="font-serif text-3xl italic">{formatBs(s.totalImpuestos)}</p>
            <p className="mt-2 text-xs text-foreground/60">
              Sepárala en una cuenta aparte para no gastarla.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Tasa efectiva del mes
            </p>
            <p className="font-serif text-3xl italic">
              {s.ingresos > 0 ? ((s.totalImpuestos / s.ingresos) * 100).toFixed(1) : "0"}%
            </p>
            <p className="mt-2 text-xs text-foreground/60">
              % de ingresos brutos destinados a impuestos.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Utilidad neta estimada
            </p>
            <p className="font-serif text-3xl italic">
              {formatBs(s.utilidad - s.totalImpuestos)}
            </p>
            <p className="mt-2 text-xs text-foreground/60">Después de cubrir impuestos.</p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "success" | "warning";
}) {
  const c = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "";
  return (
    <div className={`flex justify-between ${c}`}>
      <span className="text-foreground/60">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

function TimelineItem({
  badge,
  date,
  title,
  body,
  color,
}: {
  badge: string;
  date: string;
  title: string;
  body: string;
  color: "primary" | "warning" | "danger";
}) {
  const bg = color === "primary" ? "bg-primary" : color === "warning" ? "bg-warning" : "bg-danger";
  return (
    <div className="relative mb-8 last:mb-0">
      <div className={`absolute -left-[41px] top-1 size-4 rounded-full ${bg} ring-4 ring-card`} />
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground ${bg}`}>
        {badge}
      </span>
      <p className="mt-2 text-xs font-bold uppercase text-foreground/40">{date}</p>
      <p className="mt-1 font-serif text-xl italic">{title}</p>
      <p className="mt-1 max-w-2xl text-sm text-foreground/70">{body}</p>
    </div>
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

function RegimeCard({ o }: { o: RegimeOption }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-5 ring-1 transition-all ${
        o.recommended
          ? "bg-primary text-primary-foreground ring-primary"
          : o.eligible
            ? "bg-card ring-black/5"
            : "bg-card ring-black/5 opacity-60"
      }`}
    >
      {o.recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success-foreground">
          Recomendado
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-lg italic leading-tight">{o.name}</h3>
        {!o.eligible && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
              o.recommended ? "bg-white/20" : "bg-danger/10 text-danger"
            }`}
          >
            No aplica
          </span>
        )}
      </div>
      <p className={`mt-1 text-xs ${o.recommended ? "text-primary-foreground/70" : "text-foreground/50"}`}>
        {o.who}
      </p>

      <div
        className={`my-4 border-y py-3 ${
          o.recommended ? "border-white/20" : "border-border"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Pago anual estimado</p>
        <p className="font-serif text-3xl italic">{formatBs(o.annual)}</p>
        <p className={`text-xs ${o.recommended ? "text-primary-foreground/70" : "text-foreground/50"}`}>
          {o.headline}
        </p>
      </div>

      <ul className="space-y-1.5">
        {o.detail.map((d, i) => (
          <li
            key={i}
            className={`flex gap-2 text-xs ${
              o.recommended ? "text-primary-foreground/80" : "text-foreground/60"
            }`}
          >
            <span className={o.recommended ? "text-success-foreground" : "text-primary"}>›</span>
            {d}
          </li>
        ))}
      </ul>
      <p className={`mt-3 text-[11px] ${o.recommended ? "text-primary-foreground/60" : "text-foreground/45"}`}>
        {o.note}
      </p>
    </div>
  );
}

// Suppress unused warnings on constants imported for reference clarity
void IVA_RATE;
