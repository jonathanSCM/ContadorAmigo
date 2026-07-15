import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { loadMovements, loadNit, saveNit } from "@/lib/storage";
import { calcMonthly, healthStatus } from "@/lib/tax";
import { BusinessSwitcher } from "@/components/BusinessSwitcher";
import { Onboarding } from "@/components/Onboarding";
import { Moon, Sun } from "lucide-react";

const NAV = [
  { to: "/", label: "Panel" },
  { to: "/movimientos", label: "Movimientos" },
  { to: "/productos", label: "Productos" },
  { to: "/analisis", label: "Análisis" },
  { to: "/impuestos", label: "Impuestos" },
  { to: "/facturacion", label: "Facturación" },
  { to: "/aprender", label: "Aprender" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [nit, setNit] = useState("");
  const [health, setHealth] = useState<ReturnType<typeof healthStatus> | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setNit(loadNit());
    setHealth(healthStatus(calcMonthly(loadMovements())));
  }, [pathname]);

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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="ContadorAmigo" className="size-9" />
            <span className="font-serif text-xl italic font-semibold tracking-tight">
              ContadorAmigo
            </span>
          </Link>

          <div className="hidden gap-1 md:flex">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
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

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema claro/oscuro"
              title="Cambiar tema"
              className="grid size-8 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:text-foreground"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <BusinessSwitcher />
            <input
              value={nit}
              onChange={(e) => {
                setNit(e.target.value);
                saveNit(e.target.value);
              }}
              placeholder="NIT"
              className="hidden w-28 rounded-full border border-border bg-transparent px-3 py-1 text-xs font-medium placeholder:text-foreground/30 focus:border-primary/40 focus:outline-none lg:block"
            />
            {health && (
              <div
                className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-bold sm:flex ${healthBg}`}
              >
                <span className={`size-2 animate-pulse rounded-full ${dotColor}`} />
                {health.label}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-3 md:hidden">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
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

      <footer className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-border px-6 py-8 text-xs text-foreground/40">
        <p>Diseñado para el emprendedor boliviano · Datos guardados en tu navegador</p>
        <Link to="/aprender" className="font-bold hover:text-primary">
          Normativa SIN
        </Link>
      </footer>
    </div>
  );
}
