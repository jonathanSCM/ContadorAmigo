import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConceptPopover } from "@/components/ConceptPopover";
import {
  addMovement,
  clearMovements,
  deleteMovement,
  listMovements,
  loadDemoMovements,
  updateMovement,
} from "@/lib/movements.server";
import { loadDemoProducts } from "@/lib/products.server";
import type { Movement, MovementType } from "@/lib/storage";
import { formatBs, IVA_RATE } from "@/lib/tax";
import { ChevronLeft, ChevronRight, Download, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/movimientos")({
  head: () => ({
    meta: [
      { title: "Movimientos — ContadorAmigo" },
      { name: "description", content: "Registra ingresos y gastos de tu emprendimiento." },
    ],
  }),
  component: Movimientos,
});

const CATEGORIES = ["Ventas", "Servicios", "Insumos", "Fijos", "Salarios", "Marketing", "Activo Fijo", "Otros"];
const today = () => new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 15;

function Movimientos() {
  const { businessId } = Route.useParams();
  const [movs, setMovs] = useState<Movement[]>([]);
  const [type, setType] = useState<MovementType>("ingreso");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [hasInvoice, setHasInvoice] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(today());
  const [providerName, setProviderName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [providerNit, setProviderNit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<"todos" | MovementType>("todos");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const refresh = () => listMovements({ data: businessId }).then(setMovs);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const resetForm = () => {
    setEditingId(null);
    setType("ingreso");
    setConcept("");
    setAmount("");
    setHasInvoice(true);
    setCategory(CATEGORIES[0]);
    setDate(today());
    setProviderName("");
    setInvoiceNumber("");
    setProviderNit("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(amount);
    if (!concept.trim() || !total || total <= 0) {
      toast.error("Completa concepto y monto válido");
      return;
    }
    const amt = hasInvoice ? Math.round((total / (1 + IVA_RATE)) * 100) / 100 : total;
    const iso = new Date(`${date}T12:00:00`).toISOString();
    const providerFields =
      type === "gasto"
        ? {
            providerName: providerName.trim() || undefined,
            invoiceNumber: hasInvoice ? invoiceNumber.trim() || undefined : undefined,
            providerNit: hasInvoice ? providerNit.trim() || undefined : undefined,
          }
        : {};
    setSaving(true);
    try {
      if (editingId) {
        await updateMovement({
          data: {
            id: editingId,
            businessId,
            type,
            concept: concept.trim(),
            amountNet: amt,
            hasInvoice,
            category,
            date: iso,
            ...providerFields,
          },
        });
        toast.success("Movimiento actualizado");
      } else {
        await addMovement({
          data: {
            businessId,
            type,
            concept: concept.trim(),
            amountNet: amt,
            hasInvoice,
            category,
            date: iso,
            ...providerFields,
          },
        });
        toast.success(`${type === "ingreso" ? "Ingreso" : "Gasto"} registrado`);
      }
      await refresh();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: Movement) => {
    setEditingId(m.id);
    setType(m.type);
    setConcept(m.concept);
    const total = m.hasInvoice ? Math.round(m.amountNet * (1 + IVA_RATE) * 100) / 100 : m.amountNet;
    setAmount(String(total));
    setHasInvoice(m.hasInvoice);
    setCategory(m.category);
    setDate(m.date.slice(0, 10));
    setProviderName(m.providerName ?? "");
    setInvoiceNumber(m.invoiceNumber ?? "");
    setProviderNit(m.providerNit ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    await deleteMovement({ data: { id, businessId } });
    await refresh();
    if (editingId === id) resetForm();
    toast.success("Movimiento eliminado");
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ movements: movs }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contadoramigo-respaldo.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Respaldo descargado");
  };

  const doReset = async () => {
    if (!confirm("¿Cargar el negocio de ejemplo? Se reemplazarán tus datos actuales.")) return;
    await loadDemoMovements({ data: businessId });
    await loadDemoProducts({ data: businessId });
    await refresh();
    resetForm();
    toast.success("Negocio de ejemplo cargado");
  };

  const doClear = async () => {
    if (!confirm("¿Borrar TODOS los movimientos? Esta acción no se puede deshacer.")) return;
    await clearMovements({ data: businessId });
    await refresh();
    resetForm();
    toast.success("Datos borrados");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movs
      .filter((m) => {
        if (filter !== "todos" && m.type !== filter) return false;
        if (catFilter !== "todas" && m.category !== catFilter) return false;
        if (q && !m.concept.toLowerCase().includes(q) && !m.category.toLowerCase().includes(q))
          return false;
        const day = m.date.slice(0, 10);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [movs, filter, catFilter, search, dateFrom, dateTo]);

  // Volver a la página 1 cada vez que cambian los filtros.
  useEffect(() => {
    setPage(1);
  }, [filter, catFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe],
  );

  const previewTotal = parseFloat(amount) || 0;
  const previewNet = hasInvoice ? previewTotal / (1 + IVA_RATE) : previewTotal;
  const previewIva = hasInvoice ? previewTotal - previewNet : 0;

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4 sm:gap-8 sm:p-6">
      {/* Form */}
      <section className="col-span-12 lg:col-span-5 animate-reveal">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-2xl italic">
              {editingId ? "Editar movimiento" : "Nuevo registro"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"
              >
                <X className="size-3" /> Cancelar
              </button>
            )}
          </div>
          <p className="mb-6 text-sm text-primary-foreground/70">
            {editingId ? "Modifica los datos y guarda los cambios." : "Se guarda en tu cuenta, no en este navegador."}
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">Tipo</label>
              <div className="flex gap-2">
                {(["ingreso", "gasto"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider ring-1 transition-all ${
                      type === t
                        ? "bg-background text-primary ring-background"
                        : "bg-white/5 opacity-70 ring-white/20"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">Concepto</label>
              <input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Venta de mercadería"
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/20 placeholder:text-primary-foreground/40 focus:outline-none focus:ring-white/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">
                  Monto total (Bs)
                </label>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg font-bold ring-1 ring-white/20 placeholder:text-primary-foreground/30 focus:outline-none focus:ring-white/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg bg-white/10 px-3 py-3 text-sm font-medium ring-1 ring-white/20 focus:outline-none focus:ring-white/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/20 focus:outline-none focus:ring-white/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {type === "gasto" && (
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">
                  Proveedor <span className="normal-case opacity-60">(opcional)</span>
                </label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Ej: Distribuidora La Cruceña"
                  className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/20 placeholder:text-primary-foreground/40 focus:outline-none focus:ring-white/50"
                />
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
              <input
                type="checkbox"
                checked={hasInvoice}
                onChange={(e) => setHasInvoice(e.target.checked)}
                className="mt-1 accent-background"
              />
              <div>
                <p className="text-sm font-bold">Con factura (IVA 13%)</p>
                <p className="text-xs opacity-70">
                  {type === "ingreso"
                    ? "Genera débito fiscal a pagar al SIN."
                    : "Genera crédito fiscal a tu favor: reduce el IVA que pagas."}
                </p>
              </div>
            </label>

            {type === "gasto" && hasInvoice && (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">
                    N° de factura
                  </label>
                  <input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej: 1024"
                    className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium ring-1 ring-white/20 placeholder:text-primary-foreground/40 focus:outline-none focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase opacity-70">
                    NIT proveedor
                  </label>
                  <input
                    value={providerNit}
                    onChange={(e) => setProviderNit(e.target.value)}
                    placeholder="Ej: 1023845017"
                    className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium ring-1 ring-white/20 placeholder:text-primary-foreground/40 focus:outline-none focus:ring-white/50"
                  />
                </div>
              </div>
            )}

            {previewTotal > 0 && (
              <div className="rounded-lg bg-white/10 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="opacity-70">Total</span>
                  <span className="font-bold">{formatBs(previewTotal)}</span>
                </div>
                {previewIva > 0 && (
                  <div className="mt-1 flex justify-between">
                    <span className="opacity-70">IVA (13%)</span>
                    <span className="font-bold">{formatBs(previewIva)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-white/20 pt-2">
                  <span className="opacity-70">Neto</span>
                  <span className="text-lg font-extrabold">{formatBs(previewNet)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-background py-3 text-sm font-bold text-primary shadow-xl shadow-black/10 transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Guardar movimiento"}
            </button>
          </form>
        </div>
      </section>

      {/* List */}
      <section className="col-span-12 lg:col-span-7 animate-reveal [animation-delay:150ms]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl italic">Historial</h2>
            <p className="text-sm text-foreground/60">
              {filtered.length} de {movs.length} movimientos
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-secondary p-1 text-xs font-bold">
            {(["todos", "ingreso", "gasto"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 uppercase transition-all ${
                  filter === f ? "bg-foreground text-background" : "text-foreground/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por concepto o categoría…"
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-8 text-sm focus:border-primary/40 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/40 hover:text-foreground"
                aria-label="Limpiar"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium focus:border-primary/40 focus:outline-none"
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-foreground/50">Del</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm focus:border-primary/40 focus:outline-none"
          />
          <label className="text-xs font-bold text-foreground/50">al</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm focus:border-primary/40 focus:outline-none"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-foreground/60 hover:text-foreground"
            >
              <X className="size-3" /> Quitar fechas
            </button>
          )}
        </div>

        <div className="space-y-px overflow-hidden rounded-2xl ring-1 ring-black/5">
          {paginated.map((m) => {
            const gross = m.hasInvoice ? m.amountNet * (1 + IVA_RATE) : m.amountNet;
            const iva = m.hasInvoice ? m.amountNet * IVA_RATE : 0;
            const isIn = m.type === "ingreso";
            return (
              <div
                key={m.id}
                className={`group flex items-center justify-between p-4 transition-colors hover:bg-secondary ${
                  editingId === m.id ? "bg-primary/10" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`grid size-10 place-items-center rounded-full font-bold ${
                      isIn ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {isIn ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{m.concept}</p>
                    <p className="text-xs text-foreground/40">
                      {new Date(m.date).toLocaleDateString("es-BO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {m.category}
                      {m.providerName && ` · ${m.providerName}`}
                      {m.hasInvoice && (m.invoiceNumber ? ` · Factura N° ${m.invoiceNumber}` : " · Con factura")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="mr-2 text-right">
                    <p className={`font-bold ${isIn ? "text-success" : "text-danger"}`}>
                      {isIn ? "+ " : "− "}
                      {formatBs(gross)}
                    </p>
                    {iva > 0 && <p className="text-[10px] text-foreground/40">IVA {formatBs(iva)}</p>}
                  </div>
                  <button
                    onClick={() => startEdit(m)}
                    className="rounded-lg p-2 text-foreground/30 transition-all hover:bg-primary/10 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    className="rounded-lg p-2 text-foreground/30 transition-all hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="bg-card p-8 text-center text-sm text-foreground/50">
              {movs.length === 0
                ? "Aún no hay movimientos. Registra tu primera venta o gasto."
                : "Ningún movimiento coincide con tu búsqueda."}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-foreground/50">
              Página {pageSafe} de {totalPages} · {filtered.length} movimientos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="grid size-8 place-items-center rounded-full border border-border bg-card text-foreground/60 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="grid size-8 place-items-center rounded-full border border-border bg-card text-foreground/60 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-foreground/50">
          <ConceptPopover conceptKey="credito-fiscal" label="¿Qué es el crédito fiscal?" />
        </p>
      </section>

      {/* Gestión de datos */}
      <section className="col-span-12 animate-reveal [animation-delay:250ms] rounded-3xl border-2 border-dashed border-border bg-secondary p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl italic">Tus datos</h3>
            <p className="mt-1 max-w-lg text-sm text-foreground/60">
              Guardados en tu cuenta. Descarga un respaldo cuando quieras una copia local.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold ring-1 ring-black/5 transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" /> Descargar respaldo
            </button>
            <button
              onClick={doReset}
              className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold ring-1 ring-black/5 transition-transform hover:scale-[1.02]"
            >
              <RotateCcw className="size-4" /> Datos de ejemplo
            </button>
            <button
              onClick={doClear}
              className="inline-flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-bold text-danger transition-transform hover:scale-[1.02]"
            >
              <Trash2 className="size-4" /> Empezar de cero
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
