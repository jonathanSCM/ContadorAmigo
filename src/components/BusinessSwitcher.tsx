import { useEffect, useRef, useState } from "react";
import {
  addBusiness,
  activeBusiness,
  deleteBusiness,
  listBusinesses,
  renameBusiness,
  switchBusiness,
  type Business,
} from "@/lib/profiles";
import { Building2, Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";

type Mode = "list" | "add" | "rename";

export function BusinessSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("list");
  const [name, setName] = useState("");
  const [list, setList] = useState<Business[]>([]);
  const [active, setActive] = useState<Business | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setList(listBusinesses());
    setActive(activeBusiness());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("list");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Antes de montar en el cliente, mostramos un marcador neutro (evita
  // desajustes de hidratación con SSR).
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-bold">
        <Building2 className="size-4 text-primary" />
        Mi negocio
      </div>
    );
  }

  const doSwitch = (id: string) => {
    switchBusiness(id);
    window.location.reload();
  };
  const doAdd = () => {
    if (!name.trim()) return;
    addBusiness(name.trim());
    window.location.reload();
  };
  const doRename = () => {
    if (!active || !name.trim()) return;
    renameBusiness(active.id, name.trim());
    window.location.reload();
  };
  const doDelete = () => {
    if (!active) return;
    if (!confirm(`¿Eliminar "${active.name}" y todos sus datos? No se puede deshacer.`)) return;
    deleteBusiness(active.id);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setMode("list");
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold transition-colors hover:border-primary/40 sm:gap-2 sm:px-3 sm:text-sm"
      >
        <Building2 className="size-4 shrink-0 text-primary" />
        <span className="max-w-[68px] truncate sm:max-w-[140px]">{active?.name ?? "Mi negocio"}</span>
        <ChevronDown className={`size-3.5 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {mode === "list" && (
            <>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                Tus negocios
              </p>
              <div className="max-h-56 overflow-y-auto">
                {list.map((b) => {
                  const isActive = b.id === active?.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => (isActive ? setOpen(false) : doSwitch(b.id))}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                    >
                      <span
                        className={`grid size-6 place-items-center rounded-md text-xs ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/40"
                        }`}
                      >
                        {isActive ? <Check className="size-3.5" /> : <Building2 className="size-3.5" />}
                      </span>
                      <span className="flex-1 truncate font-medium">{b.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border p-1.5">
                <MenuAction
                  icon={<Plus className="size-4" />}
                  label="Añadir negocio"
                  onClick={() => {
                    setName("");
                    setMode("add");
                  }}
                />
                <MenuAction
                  icon={<Pencil className="size-4" />}
                  label="Renombrar este negocio"
                  onClick={() => {
                    setName(active?.name ?? "");
                    setMode("rename");
                  }}
                />
                {list.length > 1 && (
                  <MenuAction
                    icon={<Trash2 className="size-4" />}
                    label="Eliminar este negocio"
                    danger
                    onClick={doDelete}
                  />
                )}
              </div>
            </>
          )}

          {(mode === "add" || mode === "rename") && (
            <div className="p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                {mode === "add" ? "Nuevo negocio" : "Renombrar negocio"}
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (mode === "add" ? doAdd() : doRename())}
                placeholder="Ej: Transporte Illimani"
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium ring-1 ring-black/5 focus:outline-none focus:ring-primary/40"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={mode === "add" ? doAdd : doRename}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
                >
                  {mode === "add" ? "Crear" : "Guardar"}
                </button>
                <button
                  onClick={() => setMode("list")}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-foreground/70"
                >
                  Cancelar
                </button>
              </div>
              {mode === "add" && (
                <p className="mt-3 text-xs text-foreground/50">
                  El negocio nuevo empieza en blanco, con sus propios movimientos, productos y metas.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary ${
        danger ? "text-danger" : "text-foreground/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
