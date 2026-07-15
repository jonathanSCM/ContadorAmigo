import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { listMyBusinesses, type BusinessRow } from "@/lib/businesses.server";
import { Building2, Check, ChevronDown, LayoutGrid } from "lucide-react";

export function BusinessSwitcher({ currentId, currentName }: { currentId: string; currentName: string }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<BusinessRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) listMyBusinesses().then(setList);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold transition-colors hover:border-primary/40 sm:gap-2 sm:px-3 sm:text-sm"
      >
        <Building2 className="size-4 shrink-0 text-primary" />
        <span className="max-w-[68px] truncate sm:max-w-[140px]">{currentName}</span>
        <ChevronDown className={`size-3.5 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            Tus negocios
          </p>
          <div className="max-h-56 overflow-y-auto">
            {list.map((b) => {
              const isActive = b.id === currentId;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) navigate({ to: "/negocio/$businessId", params: { businessId: b.id } });
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span
                    className={`grid size-6 place-items-center rounded-md text-xs ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/40"
                    }`}
                    style={isActive ? undefined : { background: b.cardColor + "22" }}
                  >
                    {isActive ? <Check className="size-3.5" /> : <Building2 className="size-3.5" />}
                  </span>
                  <span className="flex-1 truncate font-medium">{b.name}</span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border p-1.5">
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary"
            >
              <LayoutGrid className="size-4" /> Ver todos / crear nuevo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
