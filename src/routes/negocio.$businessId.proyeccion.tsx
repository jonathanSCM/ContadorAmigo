import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ConceptPopover } from "@/components/ConceptPopover";
import { formatBs, IT_RATE, IVA_RATE } from "@/lib/tax";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/proyeccion")({
  head: () => ({
    meta: [
      { title: "Proyección Financiera — ContadorAmigo" },
      {
        name: "description",
        content:
          "Proyecta tus ingresos, costos, gastos y utilidad a 12 meses, aunque tu negocio todavía no tenga historial de ventas.",
      },
    ],
  }),
  component: Proyeccion,
});

interface Period {
  key: string;
  label: string;
  sub: string;
  meses: number;
}

const PERIODS: Period[] = [
  { key: "p1", label: "Mes 1-3", sub: "Lanzamiento", meses: 3 },
  { key: "p2", label: "Mes 4-6", sub: "Crecimiento", meses: 3 },
  { key: "p3", label: "Mes 7-12", sub: "Consolidación", meses: 6 },
];

function num(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function Proyeccion() {
  const [precio, setPrecio] = useState("30");
  const [costoUnitario, setCostoUnitario] = useState("10");
  const [otrosIngresos, setOtrosIngresos] = useState("0");
  const [gastosFijos, setGastosFijos] = useState("1500");

  const [unidades, setUnidades] = useState<Record<string, string>>({
    p1: "50",
    p2: "150",
    p3: "300",
  });

  const rows = useMemo(() => {
    const precioNum = num(precio);
    const costoNum = num(costoUnitario);
    const otrosNum = num(otrosIngresos);
    const gastosNum = num(gastosFijos);

    return PERIODS.map((p) => {
      const unidadesPorMes = num(unidades[p.key] ?? "0");
      const ingresos = p.meses * (unidadesPorMes * precioNum + otrosNum);
      const costosDirectos = p.meses * unidadesPorMes * costoNum;
      const utilidadBruta = ingresos - costosDirectos;
      const gastosOperativos = p.meses * gastosNum;
      const utilidadOperativa = utilidadBruta - gastosOperativos;
      const it = ingresos * IT_RATE;
      const iva = Math.max(0, utilidadOperativa) * IVA_RATE;
      const utilidadNeta = utilidadOperativa - it - iva;
      return { period: p, unidadesPorMes, ingresos, costosDirectos, utilidadBruta, gastosOperativos, utilidadOperativa, it, iva, utilidadNeta };
    });
  }, [precio, costoUnitario, otrosIngresos, gastosFijos, unidades]);

  const total = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          ingresos: acc.ingresos + r.ingresos,
          costosDirectos: acc.costosDirectos + r.costosDirectos,
          utilidadBruta: acc.utilidadBruta + r.utilidadBruta,
          gastosOperativos: acc.gastosOperativos + r.gastosOperativos,
          utilidadOperativa: acc.utilidadOperativa + r.utilidadOperativa,
          it: acc.it + r.it,
          iva: acc.iva + r.iva,
          utilidadNeta: acc.utilidadNeta + r.utilidadNeta,
        }),
        { ingresos: 0, costosDirectos: 0, utilidadBruta: 0, gastosOperativos: 0, utilidadOperativa: 0, it: 0, iva: 0, utilidadNeta: 0 },
      ),
    [rows],
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <header className="animate-reveal">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-4xl italic">Proyección financiera</h1>
          <ConceptPopover conceptKey="estado-resultados" />
        </div>
        <p className="mt-2 max-w-2xl text-foreground/60">
          Para negocios sin historial de ventas todavía: estima cuánto vas a vender y gastar, y
          proyecta tu utilidad a 12 meses en tres etapas, igual que en un plan de negocio.
        </p>
      </header>

      {/* Supuestos */}
      <section className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5">
        <h2 className="mb-5 font-serif text-2xl italic">1. Tus supuestos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Precio de venta promedio" value={precio} onChange={setPrecio} />
          <Field label="Costo directo por unidad" value={costoUnitario} onChange={setCostoUnitario} />
          <Field label="Otros ingresos mensuales" value={otrosIngresos} onChange={setOtrosIngresos} hint="Ej: publicidad, comisiones" />
          <Field label="Gastos fijos mensuales" value={gastosFijos} onChange={setGastosFijos} hint="Alquiler, sueldos, servicios" />
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold text-foreground/70">
          Unidades o ventas estimadas por mes, en cada etapa
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PERIODS.map((p) => (
            <div key={p.key}>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                {p.label} · {p.sub}
              </label>
              <input
                inputMode="decimal"
                value={unidades[p.key] ?? ""}
                onChange={(e) => setUnidades((u) => ({ ...u, [p.key]: e.target.value.replace(",", ".") }))}
                className="w-full rounded-xl bg-secondary py-3 px-4 text-lg font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Tabla proyección */}
      <section className="animate-reveal [animation-delay:100ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h2 className="font-serif text-2xl italic">2. Proyección a 12 meses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wide text-foreground/50">
                <th className="py-2 pr-3">Concepto</th>
                {rows.map((r) => (
                  <th key={r.period.key} className="px-3 py-2 text-right">
                    {r.period.label}
                    <span className="block font-normal normal-case text-foreground/40">{r.period.sub}</span>
                  </th>
                ))}
                <th className="py-2 pl-3 text-right text-primary">Total anual</th>
              </tr>
            </thead>
            <tbody>
              <PnlRow label="Ingresos" rows={rows} field="ingresos" total={total.ingresos} />
              <PnlRow label="(-) Costos directos" rows={rows} field="costosDirectos" total={total.costosDirectos} negative />
              <PnlRow label="(=) Utilidad bruta" rows={rows} field="utilidadBruta" total={total.utilidadBruta} strong />
              <PnlRow label="(-) Gastos operativos" rows={rows} field="gastosOperativos" total={total.gastosOperativos} negative />
              <PnlRow label="(=) Utilidad operativa" rows={rows} field="utilidadOperativa" total={total.utilidadOperativa} strong />
              <PnlRow label="(-) IT (3%)" rows={rows} field="it" total={total.it} negative />
              <PnlRow label="(-) IVA estimado (13%)" rows={rows} field="iva" total={total.iva} negative />
              <PnlRow label="(=) Utilidad neta" rows={rows} field="utilidadNeta" total={total.utilidadNeta} strong highlight />
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-foreground/50">
          Esta proyección es una estimación educativa: el IT se calcula sobre ingresos y el IVA se
          estima sobre la utilidad operativa, sin descontar crédito fiscal. Sirve para planificar,
          no reemplaza tu declaración real ante el SIN.
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-sm italic text-foreground/40">Bs</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
          className="w-full rounded-xl bg-secondary py-3 pl-10 pr-4 text-lg font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-foreground/40">{hint}</p>}
    </div>
  );
}

interface ProjectionRow {
  period: Period;
  ingresos: number;
  costosDirectos: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadOperativa: number;
  it: number;
  iva: number;
  utilidadNeta: number;
}

function PnlRow({
  label,
  rows,
  field,
  total,
  negative,
  strong,
  highlight,
}: {
  label: string;
  rows: ProjectionRow[];
  field: keyof Omit<ProjectionRow, "period">;
  total: number;
  negative?: boolean;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-border/60 ${highlight ? "bg-success/10" : ""}`}>
      <td className={`py-2.5 pr-3 ${strong ? "font-bold" : "text-foreground/70"}`}>{label}</td>
      {rows.map((r) => {
        const v = r[field] as number;
        const showMinus = v < 0 || (negative && v > 0);
        return (
          <td
            key={r.period.key}
            className={`px-3 py-2.5 text-right tabular-nums ${strong ? "font-bold" : ""} ${v < 0 ? "text-danger" : ""}`}
          >
            {showMinus ? "− " : ""}
            {formatBs(Math.abs(v))}
          </td>
        );
      })}
      <td
        className={`py-2.5 pl-3 text-right tabular-nums ${strong ? "font-extrabold" : "font-bold"} ${total < 0 ? "text-danger" : "text-primary"}`}
      >
        {total < 0 || (negative && total > 0) ? "− " : ""}
        {formatBs(Math.abs(total))}
      </td>
    </tr>
  );
}
