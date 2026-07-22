import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ConceptPopover } from "@/components/ConceptPopover";
import { listMovements } from "@/lib/movements.server";
import { cachedCall } from "@/lib/query-cache";
import { updateBusiness } from "@/lib/businesses.server";
import type { Movement } from "@/lib/storage";
import { formatBs, IT_RATE, IUE_RATE, nextTaxDue } from "@/lib/tax";
import {
  annualEstimate,
  filterByPeriod,
  filterByRange,
  periodRange,
  profitAndLoss,
  profitAndLossRange,
  providerSummary,
  providerSummaryRange,
  type Period,
} from "@/lib/analysis";
import { compareRegimes, type RegimeOption } from "@/lib/regimes";
import { gestionRange, SECTOR_INFO, DEFAULT_SECTOR, type Sector } from "@/lib/sectors";
import { Info } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/impuestos")({
  head: () => ({
    meta: [
      { title: "Impuestos — ContadorAmigo" },
      {
        name: "description",
        content:
          "Calcula tu IVA, IT e IUE en Bolivia por período exacto, con tu Cierre de Gestión real según tu rubro.",
      },
    ],
  }),
  component: Impuestos,
});

const PERIODOS: { id: Period; label: string }[] = [
  { id: "dia", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
  { id: "anio", label: "Este año" },
  { id: "todo", label: "Todo" },
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" });

function Impuestos() {
  const { businessId } = Route.useParams();
  const { business } = useLoaderData({ from: "/negocio/$businessId" });
  const [movs, setMovs] = useState<Movement[]>([]);
  const [capital, setCapital] = useState("22000");
  const [period, setPeriod] = useState<Period | "custom">("mes");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sector, setSectorState] = useState<Sector>(business.sector ?? DEFAULT_SECTOR);

  useEffect(() => {
    cachedCall(`movements:${businessId}`, () => listMovements({ data: businessId })).then(setMovs);
  }, [businessId]);

  useEffect(() => {
    setExpandedProvider(null);
  }, [period, customFrom, customTo]);

  const isCustom = period === "custom";
  const customStart = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
  const customEnd = customTo ? new Date(`${customTo}T23:59:59.999`) : null;
  const hasCustomRange = isCustom && customStart && customEnd;

  const isTaxPeriod =
    period === "mes" || period === "anio" || period === "todo" || Boolean(hasCustomRange);

  const range = useMemo(
    () =>
      hasCustomRange
        ? { start: customStart!, end: customEnd! }
        : periodRange(movs, isCustom ? "todo" : period),
    [movs, period, hasCustomRange, customStart, customEnd, isCustom],
  );
  const pnl = useMemo(
    () =>
      hasCustomRange
        ? profitAndLossRange(movs, customStart!, customEnd!)
        : profitAndLoss(movs, isCustom ? "todo" : period),
    [movs, period, hasCustomRange, customStart, customEnd, isCustom],
  );
  const gastosTotal = pnl.costoVentas + pnl.gastosOperativos;

  const due = useMemo(() => nextTaxDue(business.nit ?? ""), [business.nit]);
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

  const gestion = useMemo(() => gestionRange(sector), [sector]);
  const gestionPnl = useMemo(
    () => profitAndLossRange(movs, gestion.start, gestion.end),
    [movs, gestion],
  );
  const iueGestion = Math.max(0, gestionPnl.utilidadOperativa) * IUE_RATE;
  const gestionEnCurso = new Date() <= gestion.end;

  const providers = useMemo(
    () =>
      hasCustomRange
        ? providerSummaryRange(movs, customStart!, customEnd!)
        : providerSummary(movs, isCustom ? "todo" : period),
    [movs, period, hasCustomRange, customStart, customEnd, isCustom],
  );
  const inPeriodMovs = useMemo(
    () =>
      hasCustomRange
        ? filterByRange(movs, customStart!, customEnd!)
        : filterByPeriod(movs, isCustom ? "todo" : period),
    [movs, period, hasCustomRange, customStart, customEnd, isCustom],
  );
  const topByCompras = useMemo(
    () => (providers.length > 0 ? [...providers].sort((a, b) => b.compras - a.compras)[0] : null),
    [providers],
  );
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const providerHistory = useMemo(
    () =>
      expandedProvider
        ? inPeriodMovs
            .filter((m) => m.type === "gasto" && m.providerName === expandedProvider)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [inPeriodMovs, expandedProvider],
  );

  const changeSector = (s: Sector) => {
    setSectorState(s);
    updateBusiness({ data: { id: businessId, sector: s } });
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <header className="animate-reveal">
        <h1 className="font-serif text-4xl italic">Tus impuestos, sin susto</h1>
        <p className="mt-2 max-w-2xl text-foreground/60">
          Elige el período que quieres revisar. Cada cálculo muestra exactamente sus fechas, para
          que nunca te preguntes "¿esto de qué mes es?".
        </p>
      </header>

      <section className="animate-reveal [animation-delay:25ms] flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-card p-5 ring-1 ring-black/5">
        <div className="flex flex-wrap gap-1 rounded-full bg-secondary p-1 text-xs font-bold">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1.5 transition-all sm:px-4 ${
                period === p.id ? "bg-foreground text-background" : "text-foreground/60"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod("custom")}
            className={`rounded-full px-3 py-1.5 transition-all sm:px-4 ${
              isCustom ? "bg-foreground text-background" : "text-foreground/60"
            }`}
          >
            Personalizado
          </button>
        </div>
        {isCustom ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-foreground/50">Del</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm focus:border-primary/40 focus:outline-none"
            />
            <label className="text-xs font-bold text-foreground/50">al</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>
        ) : (
          <p className="text-sm text-foreground/60">
            Período: <span className="font-bold text-foreground">{fmtDate(range.start)}</span> —{" "}
            <span className="font-bold text-foreground">{fmtDate(range.end)}</span>
          </p>
        )}
      </section>

      {isCustom && !hasCustomRange ? (
        <section className="animate-reveal [animation-delay:50ms] flex gap-3 rounded-2xl bg-secondary p-6 text-sm text-foreground/70">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>Elige una fecha de inicio y una de fin para ver el cálculo de ese rango.</p>
        </section>
      ) : !isTaxPeriod ? (
        <section className="animate-reveal [animation-delay:50ms] space-y-4">
          <div className="rounded-3xl bg-card p-8 ring-1 ring-black/5">
            <p className="mb-1 text-xs uppercase text-foreground/50">
              Resumen de caja · {PERIODOS.find((p) => p.id === period)?.label}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-foreground/50">Ingresos</p>
                <p className="mt-1 font-serif text-3xl italic text-success">{formatBs(pnl.ingresos)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground/50">Gastos</p>
                <p className="mt-1 font-serif text-3xl italic text-danger">{formatBs(gastosTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground/50">Utilidad del período</p>
                <p
                  className={`mt-1 font-serif text-3xl italic ${
                    pnl.ingresos - gastosTotal >= 0 ? "text-foreground" : "text-danger"
                  }`}
                >
                  {formatBs(pnl.ingresos - gastosTotal)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-foreground/70">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              En Bolivia <b>no existe una obligación de pagar impuestos diaria ni semanal</b>: el
              IVA y el IT se calculan mes a mes, y el IUE una vez al año. Esta vista es solo para
              que veas cómo te fue en el día o la semana. Cambia a{" "}
              <button onClick={() => setPeriod("mes")} className="font-bold text-primary underline">
                Este mes
              </button>{" "}
              para ver tu cálculo tributario real.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="animate-reveal [animation-delay:50ms] rounded-3xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl italic">Resultado del período</h2>
              <ConceptPopover conceptKey="utilidad" />
            </div>
            <div className="divide-y divide-border text-sm">
              <PnlLine label="Ingresos del período" value={pnl.ingresos} tone="in" />
              <PnlLine label="(−) Gastos del período" value={-gastosTotal} tone="out" />
              <PnlLine
                label="= Utilidad antes de impuestos"
                value={pnl.utilidadOperativa}
                tone="sub"
              />
              <PnlLine label="(−) Impuestos (IVA + IT)" value={-pnl.impuestos} tone="out" />
            </div>
            <div className="mt-4 rounded-2xl bg-secondary p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">Utilidad después de impuestos</span>
                <span
                  className={`font-serif text-3xl italic ${
                    pnl.utilidadNeta >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatBs(pnl.utilidadNeta)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/50">
                Margen neto {(pnl.margenNeto * 100).toFixed(1)}% · el IUE anual se calcula aparte, en
                tu Cierre de Gestión (más abajo).
              </p>
            </div>
          </section>

          {pnl.ivaCredito > 0 && (
            <section className="animate-reveal [animation-delay:75ms] flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-success/10 p-6">
              <div className="flex items-center gap-2">
                <p className="font-bold text-success">
                  Ahorro tributario del período: {formatBs(pnl.ivaCredito)}
                </p>
                <ConceptPopover conceptKey="ahorro-tributario" />
              </div>
              <p className="max-w-md text-sm text-foreground/60">
                Es el IVA que dejaste de pagar por exigir factura en tus compras. Cada factura que
                pides es dinero que se queda contigo.
              </p>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="animate-reveal [animation-delay:100ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  IVA · 13%
                </span>
                <ConceptPopover conceptKey="iva" />
              </div>
              <p className="mb-1 text-xs uppercase text-foreground/50">A pagar en el período</p>
              <p className="mb-4 font-serif text-4xl italic">{formatBs(pnl.ivaAPagar)}</p>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Débito fiscal (ventas)" value={formatBs(pnl.ivaDebito)} tone="warning" />
                <Row
                  label="Crédito fiscal (compras con factura)"
                  value={`− ${formatBs(pnl.ivaCredito)}`}
                  tone="success"
                />
                <Row label="Neto a pagar" value={formatBs(pnl.ivaAPagar)} bold />
              </div>
              <p className="mt-4 text-xs text-foreground/50">Formulario 200 · Mensual</p>
            </div>

            <div className="animate-reveal [animation-delay:150ms] rounded-3xl bg-card p-6 ring-1 ring-black/5">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-warning/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-warning-foreground">
                  IT · 3%
                </span>
                <ConceptPopover conceptKey="it" />
              </div>
              <p className="mb-1 text-xs uppercase text-foreground/50">A pagar en el período</p>
              <p className="mb-4 font-serif text-4xl italic">{formatBs(pnl.it)}</p>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Ingresos brutos del período" value={formatBs(pnl.ingresos)} />
                <Row label={`× ${(IT_RATE * 100).toFixed(0)}%`} value={formatBs(pnl.it)} bold />
              </div>
              <p className="mt-4 text-xs text-foreground/50">Formulario 400 · Mensual</p>
            </div>
          </section>

          {providers.length > 0 && (
            <section className="animate-reveal [animation-delay:175ms] rounded-3xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-2xl italic">Tus proveedores</h2>
                <span className="text-xs text-foreground/50">
                  {providers.length} proveedor{providers.length === 1 ? "" : "es"}
                </span>
              </div>

              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                    Proveedor más usado
                  </p>
                  <p className="mt-1 font-serif text-lg italic">{topByCompras?.name ?? "—"}</p>
                  <p className="text-xs text-foreground/50">
                    {topByCompras ? `${topByCompras.compras} compras` : "Sin datos"}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                    Mayor monto comprado
                  </p>
                  <p className="mt-1 font-serif text-lg italic">{providers[0]?.name ?? "—"}</p>
                  <p className="text-xs text-foreground/50">
                    {providers[0] ? formatBs(providers[0].monto) : "Sin datos"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                      <th className="pb-2 pr-3">Proveedor</th>
                      <th className="pb-2 pr-3 text-right">Compras</th>
                      <th className="pb-2 pr-3 text-right">Facturas</th>
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2 text-right">Crédito fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p) => (
                      <Fragment key={p.name}>
                        <tr
                          onClick={() => setExpandedProvider(expandedProvider === p.name ? null : p.name)}
                          className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary"
                        >
                          <td className="py-2.5 pr-3 font-bold">{p.name}</td>
                          <td className="py-2.5 pr-3 text-right">{p.compras}</td>
                          <td className="py-2.5 pr-3 text-right">
                            <span
                              className={
                                p.facturas === p.compras
                                  ? "text-success"
                                  : p.facturas === 0
                                    ? "text-danger"
                                    : "text-warning-foreground"
                              }
                            >
                              {p.facturas}/{p.compras}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono">{formatBs(p.monto)}</td>
                          <td className="py-2.5 text-right font-mono text-success">
                            {p.creditoFiscal > 0 ? formatBs(p.creditoFiscal) : "—"}
                          </td>
                        </tr>
                        {expandedProvider === p.name && (
                          <tr className="border-b border-border/60 last:border-0">
                            <td colSpan={5} className="bg-secondary p-3">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                                Historial de compras a {p.name}
                              </p>
                              <div className="space-y-1.5">
                                {providerHistory.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between text-xs">
                                    <span className="text-foreground/70">
                                      {new Date(m.date).toLocaleDateString("es-BO", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}{" "}
                                      · {m.concept}
                                      {m.hasInvoice ? " · Con factura" : " · Sin factura"}
                                    </span>
                                    <span className="font-mono font-bold">{formatBs(m.amountNet)}</span>
                                  </div>
                                ))}
                                {providerHistory.length === 0 && (
                                  <p className="text-xs text-foreground/50">Sin compras en este período.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-foreground/50">
                "Facturas" muestra cuántas de tus compras a ese proveedor tuvieron factura. Si un
                proveedor casi nunca te da factura, estás perdiendo crédito fiscal con él. Toca un
                proveedor para ver su historial de compras.
              </p>
            </section>
          )}
        </>
      )}

      <section className="animate-reveal [animation-delay:180ms] rounded-3xl bg-card p-6 ring-1 ring-black/5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl italic">Cierre de Gestión</h2>
              <ConceptPopover conceptKey="cierre-gestion" />
            </div>
            <p className="mt-1 max-w-xl text-sm text-foreground/60">
              Tu año contable real para el IUE. No siempre es de enero a diciembre: depende del
              rubro de tu negocio.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Rubro de tu negocio
            </label>
            <select
              value={sector}
              onChange={(e) => changeSector(e.target.value as Sector)}
              className="rounded-xl bg-secondary px-3 py-2.5 text-sm font-bold ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
            >
              {(Object.keys(SECTOR_INFO) as Sector[]).map((s) => (
                <option key={s} value={s}>
                  {SECTOR_INFO[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Tu gestión {gestionEnCurso ? "en curso" : ""}
            </p>
            <p className="mt-1 font-serif text-lg italic">
              {fmtDate(gestion.start)} — {fmtDate(gestion.end)}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Utilidad de la gestión (a la fecha)
            </p>
            <p
              className={`mt-1 font-serif text-lg italic ${
                gestionPnl.utilidadOperativa >= 0 ? "text-foreground" : "text-danger"
              }`}
            >
              {formatBs(gestionPnl.utilidadOperativa)}
            </p>
          </div>
          <div className="rounded-2xl bg-danger/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-danger">
              IUE estimado (25%)
            </p>
            <p className="mt-1 font-serif text-lg italic text-danger">{formatBs(iueGestion)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-foreground/50">
          Vence el <b>{fmtDate(gestion.dueDate)}</b> (120 días después del cierre). Este cálculo usa
          tus movimientos reales de la gestión en curso, no una proyección; si aún no terminó tu
          gestión, el monto irá cambiando.
        </p>
      </section>

      <section className="animate-reveal [animation-delay:200ms] rounded-3xl bg-card p-8 ring-1 ring-black/5">
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

      <section className="animate-reveal [animation-delay:225ms] rounded-3xl bg-card p-8 ring-1 ring-black/5">
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
            body={`Vencimiento según tu NIT (${business.nit || "sin definir"}). Presenta Formularios 200 y 400.`}
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
            date={fmtDate(gestion.dueDate)}
            title="IUE — Cierre de Gestión"
            body={`Tu rubro (${SECTOR_INFO[sector].label}) cierra el ${fmtDate(gestion.end)}. Se puede compensar con IT del año siguiente.`}
            color="danger"
          />
        </div>
      </section>
    </main>
  );
}

function PnlLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "in" | "out" | "sub";
}) {
  const color = tone === "in" ? "text-success" : tone === "out" ? "text-danger" : "text-foreground";
  return (
    <div className={`flex items-baseline justify-between py-2.5 ${tone === "sub" ? "font-bold" : ""}`}>
      <span className={tone === "sub" ? "" : "text-foreground/70"}>{label}</span>
      <span className={`font-mono tabular-nums ${color}`}>{formatBs(value)}</span>
    </div>
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

      <div className={`my-4 border-y py-3 ${o.recommended ? "border-white/20" : "border-border"}`}>
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
