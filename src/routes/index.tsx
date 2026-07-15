import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth.server";
import { Building2, Receipt, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "ContadorAmigo — Finanzas claras para el emprendedor boliviano" },
      {
        name: "description",
        content:
          "La plataforma visual que ayuda a los emprendedores de Bolivia a entender y controlar las finanzas e impuestos de su negocio, sin necesidad de saber de contabilidad.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Receipt,
    title: "Impuestos del SIN",
    body: "Calcula IVA, IT, IUE y te decimos qué régimen te conviene (Simplificado, SIETE-RG o General), con tu Cierre de Gestión real según tu rubro.",
  },
  {
    icon: TrendingUp,
    title: "Decisiones claras",
    body: "Precio justo, punto de equilibrio, estado de resultados y la salud de tu negocio, explicados en lenguaje simple.",
  },
  {
    icon: Building2,
    title: "Multi-negocio",
    body: "Maneja varios emprendimientos desde una sola cuenta, cada uno con sus propios datos, seguros y privados.",
  },
];

const PILLARS = ["Entender", "Controlar", "Formalizar", "Crecer"];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ContadorAmigo" className="size-9" />
            <span className="font-serif text-xl italic font-semibold tracking-tight">
              ContadorAmigo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-bold text-foreground/70 hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Finanzas claras para el emprendedor boliviano
        </p>
        <h1 className="font-serif text-4xl italic leading-tight sm:text-6xl">
          Finanzas claras,
          <br />
          negocios que crecen.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/60">
          Una plataforma digital visual y explicativa que ayuda a los emprendedores y pequeños
          negocios de Bolivia a entender y controlar sus finanzas e impuestos, sin necesidad de
          saber de contabilidad.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/registro"
            className="w-full rounded-xl bg-primary px-8 py-3.5 text-center font-bold text-primary-foreground shadow-xl shadow-black/10 transition-transform hover:scale-[1.02] sm:w-auto"
          >
            Crear cuenta gratis
          </Link>
          <Link
            to="/login"
            className="w-full rounded-xl border border-border px-8 py-3.5 text-center font-bold text-foreground/70 transition-colors hover:text-foreground sm:w-auto"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-7 ring-1 ring-black/5">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="mb-2 font-serif text-xl italic">{f.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Misión */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Nuestra misión
          </p>
          <p className="font-serif text-2xl italic leading-relaxed sm:text-3xl">
            "En ContadorAmigo ayudamos a los emprendedores y pequeños negocios de Bolivia a
            entender y controlar las finanzas e impuestos de su emprendimiento, a través de una
            plataforma digital visual, sencilla y explicativa que traduce la contabilidad a un
            lenguaje claro."
          </p>
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PILLARS.map((p) => (
            <div
              key={p}
              className="rounded-2xl border border-border bg-card py-5 text-center font-bold text-primary"
            >
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
        <h2 className="font-serif text-3xl italic">¿Listo para ordenar tu negocio?</h2>
        <p className="mt-3 text-foreground/60">Gratis. Sin tarjeta. Empiezas en minutos.</p>
        <Link
          to="/registro"
          className="mt-6 inline-block rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]"
        >
          Crear cuenta gratis
        </Link>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-foreground/40 sm:px-6">
        Diseñado para el emprendedor boliviano · Tus datos son privados y seguros
      </footer>
    </div>
  );
}
