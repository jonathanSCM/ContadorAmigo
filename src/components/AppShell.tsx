import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { logoutUser } from "@/lib/auth.server";
import { updateBusiness, type BusinessRow } from "@/lib/businesses.server";
import { listMovements } from "@/lib/movements.server";
import { calcMonthly, healthStatus } from "@/lib/tax";
import { BusinessSwitcher } from "@/components/BusinessSwitcher";
import { Onboarding } from "@/components/Onboarding";
import { LogOut, Moon, Sun } from "lucide-react";

export function AppShell({ children, business }: { children: ReactNode; business: BusinessRow }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const NAV = [
    { to: "/negocio/$businessId", label: "Panel" },
    { to: "/negocio/$businessId/movimientos", label: "Movimientos" },
    { to: "/negocio/$businessId/productos", label: "Productos" },
    { to: "/negocio/$businessId/analisis", label: "Análisis" },
    { to: "/negocio/$businessId/impuestos", label: "Impuestos" },
    { to: "/negocio/$businessId/balance", label: "Balance" },
    { to: "/negocio/$businessId/facturacion", label: "Facturación" },
    { to: "/negocio/$businessId/aprender", label: "Aprender" },
  ] as const;

  const [nit, setNit] = useState(business.nit ?? "");
  const [health, setHealth] = useState<ReturnType<typeof healthStatus> | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setNit(business.nit ?? "");
  }, [business.id, business.nit]);

  useEffect(() => {
    listMovements({ data: business.id }).then((rows) => {
      setHealth(healthStatus(calcMonthly(rows)));
    });
  }, [business.id, pathname]);

  useEffect(() => {
    const isDark = localStorage.getItem("contadoramigo:theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("contadoramigo:theme", next ? "dark" : "light");
  };

  const saveNit = (value: string) => {
    setNit(value);
    updateBusiness({ data: { id: business.id, nit: value } });
  };

  const doLogout = async () => {
    await logoutUser();
    navigate({ to: "/" });
  };

  const dotColor =
    health?.level === "verde"
      ? "bg-success"
      : health?.level === "rojo"
        ? "bg-danger"
        : "bg-warning";

  const healthBg =
    health?.level === "verde"
      ? "bg-success/10 text-success"
      : health?.level === "rojo"
        ? "bg-danger/10 text-danger"
        : "bg-warning/15 text-warning-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Onboarding />
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="ContadorAmigo" className="size-8 shrink-0 sm:size-9" />
            <span className="truncate font-serif text-lg italic font-semibold tracking-tight sm:text-xl">
              ContadorAmigo
            </span>
          </Link>

          <div className="hidden gap-1 xl:flex">
            {NAV.map((n) => {
              const resolved = n.to.replace("$businessId", business.id);
              const active = n.to === "/negocio/$businessId" ? pathname === resolved : pathname.startsWith(resolved);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  params={{ businessId: business.id }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema claro/oscuro"
              title="Cambiar tema"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:text-foreground"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <BusinessSwitcher currentId={business.id} currentName={business.name} />
            <input
              value={nit}
              onChange={(e) => saveNit(e.target.value)}
              placeholder="NIT"
              className="hidden w-28 rounded-full border border-border bg-transparent px-3 py-1 text-xs font-medium placeholder:text-foreground/30 focus:border-primary/40 focus:outline-none xl:block"
            />
            {health && (
              <div
                className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-bold sm:flex ${healthBg}`}
              >
                <span className={`size-2 animate-pulse rounded-full ${dotColor}`} />
                {health.label}
              </div>
            )}
            <button
              onClick={doLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="hidden size-8 place-items-center rounded-full border border-border text-foreground/50 transition-colors hover:text-danger sm:grid"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 xl:hidden">
          {NAV.map((n) => {
            const resolved = n.to.replace("$businessId", business.id);
            const active = n.to === "/negocio/$businessId" ? pathname === resolved : pathname.startsWith(resolved);
            return (
              <Link
                key={n.to}
                to={n.to}
                params={{ businessId: business.id }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-foreground text-background" : "text-foreground/60"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {children}

      <footer className="mx-auto mt-12 flex max-w-7xl flex-col items-center gap-2 border-t border-border px-4 py-8 text-center text-xs text-foreground/40 sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p>Diseñado para el emprendedor boliviano · {business.name}</p>
        <Link
          to="/negocio/$businessId/aprender"
          params={{ businessId: business.id }}
          className="font-bold hover:text-primary"
        >
          Normativa SIN
        </Link>
      </footer>
    </div>
  );
}
