import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConceptPopover } from "@/components/ConceptPopover";
import { listMovements } from "@/lib/movements.server";
import { cachedCall } from "@/lib/query-cache";
import { updateBusiness } from "@/lib/businesses.server";
import type { Movement } from "@/lib/storage";
import { balance, formatBs } from "@/lib/tax";
import { monthlyFixedCosts, monthlyTrend, profitAndLoss, type Period } from "@/lib/analysis";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/analisis")({
  head: () => ({
    meta: [
      { title: "Análisis — ContadorAmigo" },
      {
        name: "description",
        content:
          "Estado de resultados, tendencia mensual y metas de ahorro de tu emprendimiento.",
      },
    ],
  }),
  component: Analisis,
});

const PERIODOS: { id: Period; label: string }[] = [
  { id: "mes", label: "Este mes" },
  { id: "anio", label: "Este año" },
  { id: "todo", label: "Todo" },
];

function Analisis() {
  const { businessId } = Route.useParams();
  const { business } = useLoaderData({ from: "/negocio/$businessId" });
  const [movs, setMovs] = useState<Movement[]>([]);
  const [period, setPeriod] = useState<Period>("anio");
  const [savingsLabel, setSavingsLabel] = useState(business.savingsLabel);
  const [savingsTarget, setSavingsTarget] = useState(business.savingsTarget);
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    cachedCall(`movements:${businessId}`, () => listMovements({ data: businessId })).then(setMovs);
  }, [businessId]);

  const pnl = useMemo(() => profitAndLoss(movs, period), [movs, period]);
  const trend = useMemo(() => monthlyTrend(movs, 6), [movs]);
  const fixed = useMemo(() => monthlyFixedCosts(movs), [movs]);
  const bal = useMemo(() => balance(movs), [movs]);

  const emergencyTarget = fixed * business.emergencyMonths;
  const emergencyPct = emergencyTarget > 0 ? Math.min(1, bal / emergencyTarget) : 0;
  const savingsPct = savingsTarget > 0 ? Math.min(1, bal / savingsTarget) : 0;

  const maxTrend = Math.max(...trend.flatMap((t) => [t.ingresos, t.gastos]), 1);

  const saveGoal = async () => {
    await updateBusiness({ data: { id: businessId, savingsLabel, savingsTarget } });
    setEditingGoal(false);
    toast.success("Meta actualizada");
  };

  const exportPdf = () => {
    const biz = business.name;
    const periodo = PERIODOS.find((p) => p.id === period)?.label ?? "";
    const fecha = new Date().toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const row = (label: string, value: string, o: { strong?: boolean; color?: string } = {}) =>
      `<tr><td style="padding:7px 0;${o.strong ? "font-weight:700;" : ""}">${label}</td><td style="padding:7px 0;text-align:right;font-family:monospace;color:${o.color ?? "#222"};${o.strong ? "font-weight:700;" : ""}">${value}</td></tr>`;
    const ops = pnl.operativos
      .map((o) => row(`(−) ${o.label}`, "− " + formatBs(o.value), { color: "#a8402f" }))
      .join("");
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Estado de Resultados — ${biz}</title>
<style>body{font-family:Georgia,serif;color:#2b2b2b;max-width:720px;margin:40px auto;padding:0 28px}
h1{font-size:26px;color:#B85042;margin:0 0 2px}small{color:#888}
table{width:100%;border-collapse:collapse;margin-top:26px;font-size:14px}
td{border-bottom:1px solid #eee}
.net td{background:#f4efe4;font-size:18px;font-weight:700;border:none;padding:12px 10px!important}
.foot{margin-top:22px;font-size:11px;color:#999;line-height:1.5}</style></head><body>
<h1>Estado de Resultados</h1>
<small>${biz} &middot; ${periodo} &middot; Generado el ${fecha}</small>
<table>
${row("Ventas / ingresos", formatBs(pnl.ingresos), { strong: true, color: "#2e6a4e" })}
${row("(−) Costo de ventas (insumos)", "− " + formatBs(pnl.costoVentas), { color: "#a8402f" })}
${row("= Utilidad bruta", formatBs(pnl.utilidadBruta), { strong: true })}
${ops}
${row("= Utilidad operativa", formatBs(pnl.utilidadOperativa), { strong: true })}
${row("(−) IVA e IT estimados", "− " + formatBs(pnl.impuestos), { color: "#a8402f" })}
<tr class="net"><td>Utilidad neta</td><td style="text-align:right;font-family:monospace">${formatBs(pnl.utilidadNeta)}</td></tr>
</table>
<p class="foot">Margen neto ${(pnl.margenNeto * 100).toFixed(1)}%. El IUE anual (25%) se calcula al cierre de gestión.<br>Documento generado por ContadorAmigo — estimación educativa, no es un documento contable oficial.</p>
</body></html>`;
    const w = window.open("", "_blank", "width=820,height=920");
    if (!w) {
      toast.error("Permite las ventanas emergentes para exportar el PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <header className="animate-reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl italic">Análisis del negocio</h1>
          <p className="mt-2 max-w-2xl text-foreground/60">
            De dónde viene tu ganancia, cómo evoluciona mes a mes y qué tan cerca estás de tus
            metas.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-secondary p-1 text-xs font-bold">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-4 py-1.5 transition-all ${
                period === p.id ? "bg-foreground text-background" : "text-foreground/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl italic">Estado de Resultados</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={exportPdf}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground/70 transition-colors hover:text-foreground"
              >
                <FileDown className="size-3.5" /> PDF
              </button>
              <ConceptPopover conceptKey="estado-resultados" />
            </div>
          </div>

          <div className="space-y-1">
            <PnlRow label="Ventas / ingresos" value={pnl.ingresos} tone="in" strong />
            <PnlRow label="(−) Costo de ventas (insumos)" value={-pnl.costoVentas} tone="out" />
            <PnlRow
              label="= Utilidad bruta"
              value={pnl.utilidadBruta}
              tone="sub"
              hint={`Margen bruto ${(pnl.margenBruto * 100).toFixed(0)}%`}
            />
            <div className="py-1">
              {pnl.operativos.map((o) => (
                <PnlRow key={o.label} label={`(−) ${o.label}`} value={-o.value} tone="out" small />
              ))}
              {pnl.operativos.length === 0 && (
                <p className="px-1 py-2 text-xs text-foreground/40">Sin gastos operativos en el periodo.</p>
              )}
            </div>
            <PnlRow label="= Utilidad operativa" value={pnl.utilidadOperativa} tone="sub" />
            <PnlRow label="(−) IVA e IT estimados" value={-pnl.impuestos} tone="out" />
            <div className="mt-2 rounded-2xl bg-secondary p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">Utilidad neta</span>
                <span
                  className={`font-serif text-3xl italic ${
                    pnl.utilidadNeta >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatBs(pnl.utilidadNeta)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/50">
                Margen neto {(pnl.margenNeto * 100).toFixed(1)}% · el IUE anual (25%) se calcula al
                cierre de gestión.
              </p>
            </div>
          </div>
        </section>

        <section className="animate-reveal [animation-delay:100ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl italic">Tendencia · 6 meses</h2>
            <div className="flex gap-3 text-xs font-bold">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-success" /> Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-danger" /> Gastos
              </span>
            </div>
          </div>
          <div className="flex h-52 items-end justify-between gap-3">
            {trend.map((t) => (
              <div key={t.key} className="flex w-full flex-col items-center justify-end gap-2">
                <span
                  className={`text-[10px] font-bold ${
                    t.utilidad >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {t.utilidad >= 0 ? "+" : ""}
                  {Math.round(t.utilidad / 1000)}k
                </span>
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-success/70 transition-colors hover:bg-success"
                    style={{ height: `${(t.ingresos / maxTrend) * 100}%` }}
                    title={`Ingresos: ${formatBs(t.ingresos)}`}
                  />
                  <div
                    className="w-full rounded-t-md bg-danger/60 transition-colors hover:bg-danger"
                    style={{ height: `${(t.gastos / maxTrend) * 100}%` }}
                    title={`Gastos: ${formatBs(t.gastos)}`}
                  />
                </div>
                <span className="text-[11px] font-medium capitalize text-foreground/50">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-foreground/50">
            El número sobre cada mes es la utilidad (en miles de Bs). El mes actual puede verse más
            bajo por estar en curso.
          </p>
        </section>
      </div>

      <section className="animate-reveal [animation-delay:200ms]">
        <div className="mb-4 flex items-center gap-2 px-2">
          <h2 className="font-serif text-2xl italic">Metas y respaldo</h2>
          <ConceptPopover conceptKey="fondo-emergencia" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Fondo de emergencia
            </p>
            <h3 className="mt-1 font-serif text-2xl italic">
              {business.emergencyMonths} meses de costos fijos
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Meta: {formatBs(emergencyTarget)} · tienes acumulado {formatBs(Math.max(0, bal))}
            </p>
            <Progress pct={emergencyPct} tone="primary" />
            <p className="mt-2 text-xs text-foreground/50">
              {emergencyPct >= 1
                ? "¡Listo! Tu negocio puede resistir varios meses difíciles."
                : `Te falta ${formatBs(Math.max(0, emergencyTarget - bal))} para completar tu colchón.`}
            </p>
          </div>

          <div className="rounded-3xl bg-card p-6 ring-1 ring-black/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Meta de ahorro / reinversión
                </p>
                {editingGoal ? (
                  <input
                    value={savingsLabel}
                    onChange={(e) => setSavingsLabel(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary px-3 py-1.5 font-serif text-xl italic ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
                  />
                ) : (
                  <h3 className="mt-1 font-serif text-2xl italic">{savingsLabel}</h3>
                )}
              </div>
              <button
                onClick={() => (editingGoal ? saveGoal() : setEditingGoal(true))}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground/70 hover:text-foreground"
              >
                {editingGoal ? "Guardar" : "Editar"}
              </button>
            </div>
            {editingGoal ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-foreground/50">Meta Bs</span>
                <input
                  inputMode="decimal"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(parseFloat(e.target.value) || 0)}
                  className="w-32 rounded-lg bg-secondary px-3 py-1.5 font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-foreground/60">
                Meta: {formatBs(savingsTarget)} · acumulado {formatBs(Math.max(0, bal))}
              </p>
            )}
            <Progress pct={savingsPct} tone="success" />
            <p className="mt-2 text-xs text-foreground/50">
              {savingsPct >= 1
                ? "¡Meta alcanzada! Es momento de reinvertir en tu negocio."
                : `Vas al ${(savingsPct * 100).toFixed(0)}% de tu meta.`}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PnlRow({
  label,
  value,
  tone,
  strong,
  small,
  hint,
}: {
  label: string;
  value: number;
  tone: "in" | "out" | "sub";
  strong?: boolean;
  small?: boolean;
  hint?: string;
}) {
  const color =
    tone === "in" ? "text-success" : tone === "out" ? "text-danger" : "text-foreground";
  return (
    <div
      className={`flex items-baseline justify-between border-b border-border/60 py-2 ${
        tone === "sub" ? "font-bold" : ""
      } ${small ? "pl-3 text-sm" : ""}`}
    >
      <span className={tone === "sub" ? "" : "text-foreground/70"}>
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-foreground/40">· {hint}</span>}
      </span>
      <span className={`font-mono tabular-nums ${color} ${strong ? "font-bold" : ""}`}>
        {formatBs(value)}
      </span>
    </div>
  );
}

function Progress({ pct, tone }: { pct: number; tone: "primary" | "success" }) {
  const bar = tone === "primary" ? "bg-primary" : "bg-success";
  return (
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full rounded-full ${bar} transition-all duration-700`}
        style={{ width: `${Math.max(2, pct * 100)}%` }}
      />
    </div>
  );
}
