import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getCurrentUser, logoutUser } from "@/lib/auth.server";
import {
  CARD_COLORS,
  createBusiness,
  deleteBusiness,
  listMyBusinessesWithSummary,
  updateBusiness,
  type BusinessRow,
  type BusinessRowWithSummary,
} from "@/lib/businesses.server";
import { formatBs } from "@/lib/tax";
import { SECTOR_INFO, type Sector } from "@/lib/sectors";
import { Building2, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  loader: async () => ({ businesses: await listMyBusinessesWithSummary() }),
  head: () => ({ meta: [{ title: "Mis emprendimientos — ContadorAmigo" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { businesses } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BusinessRow | null>(null);

  const doLogout = async () => {
    await logoutUser();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ContadorAmigo" className="size-8" />
            <span className="font-serif text-lg italic font-semibold">ContadorAmigo</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-foreground/60 sm:inline">Hola, {user.name}</span>
            <button
              onClick={doLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground/70 hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl italic">Tus emprendimientos</h1>
        <p className="mt-2 text-foreground/60">
          Elige uno para entrar, o crea uno nuevo. Cada emprendimiento tiene sus propios
          movimientos, impuestos y reportes.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BizCard key={b.id} biz={b} onEdit={() => setEditing(b)} />
          ))}

          <button
            onClick={() => setCreating(true)}
            className="flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-foreground/50 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-6" />
            <span className="text-sm font-bold">Nuevo emprendimiento</span>
          </button>
        </div>

        {businesses.length === 0 && (
          <p className="mt-6 text-sm text-foreground/50">
            Aún no tienes emprendimientos. Crea el primero para empezar.
          </p>
        )}
      </main>

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={async (id) => {
            setCreating(false);
            await router.invalidate();
            navigate({ to: "/negocio/$businessId", params: { businessId: id } });
          }}
        />
      )}

      {editing && (
        <EditModal
          biz={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await router.invalidate();
          }}
          onDeleted={async () => {
            setEditing(null);
            await router.invalidate();
          }}
        />
      )}
    </div>
  );
}

const HEALTH_DOT: Record<string, string> = {
  verde: "bg-emerald-400",
  amarillo: "bg-amber-400",
  rojo: "bg-red-400",
};

function BizCard({ biz, onEdit }: { biz: BusinessRowWithSummary; onEdit: () => void }) {
  const { summary } = biz;
  return (
    <div
      className="group relative flex min-h-[192px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${biz.cardColor}, ${biz.cardColor}CC)` }}
    >
      <button
        onClick={onEdit}
        className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/15 opacity-0 transition-opacity hover:bg-white/25 group-hover:opacity-100"
        aria-label="Editar"
      >
        <Pencil className="size-3.5" />
      </button>
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 opacity-80" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">
            {biz.sector ? SECTOR_INFO[biz.sector].label : "Emprendimiento"}
          </span>
        </div>
        <h3 className="mt-2 font-serif text-2xl italic leading-tight">{biz.name}</h3>
      </div>

      <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              Utilidad del mes
            </p>
            <p className="font-serif text-xl italic">{formatBs(summary.utilidadMes)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
            <span className={`size-1.5 rounded-full ${HEALTH_DOT[summary.health]}`} />
            {summary.healthLabel}
          </span>
        </div>
        <Link
          to="/negocio/$businessId"
          params={{ businessId: biz.id }}
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-2 opacity-90 hover:opacity-100"
        >
          Entrar →
        </Link>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState<Sector>("comercio_servicios");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const biz = await createBusiness({ data: { name: name.trim(), sector } });
      toast.success("Emprendimiento creado");
      onCreated(biz.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Nuevo emprendimiento">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
            Nombre
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Panadería Doña Flor"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
            Rubro
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as Sector)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            {(Object.keys(SECTOR_INFO) as Sector[]).map((s) => (
              <option key={s} value={s}>
                {SECTOR_INFO[s].label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Creando…" : "Crear"}
        </button>
      </form>
    </ModalShell>
  );
}

function EditModal({
  biz,
  onClose,
  onSaved,
  onDeleted,
}: {
  biz: BusinessRow;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(biz.name);
  const [sector, setSector] = useState<Sector>(biz.sector ?? "comercio_servicios");
  const [color, setColor] = useState(biz.cardColor);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateBusiness({ data: { id: biz.id, name, sector, cardColor: color } });
      toast.success("Guardado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${biz.name}" y todos sus datos? No se puede deshacer.`)) return;
    await deleteBusiness({ data: biz.id });
    toast.success("Emprendimiento eliminado");
    onDeleted();
  };

  return (
    <ModalShell onClose={onClose} title="Editar emprendimiento">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
            Rubro
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as Sector)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            {(Object.keys(SECTOR_INFO) as Sector[]).map((s) => (
              <option key={s} value={s}>
                {SECTOR_INFO[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
            Color de la tarjeta
          </label>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`size-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${
                  color === c ? "ring-foreground" : "ring-transparent"
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          onClick={remove}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger/10 py-3 text-sm font-bold text-danger"
        >
          <Trash2 className="size-4" /> Eliminar emprendimiento
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl italic">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-foreground/40 hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
