import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth.server";
import {
  Building2,
  CheckCircle2,
  Frown,
  HandCoins,
  HeartHandshake,
  Lightbulb,
  Palette,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

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

const PROBLEMS = [
  "Muchos emprendedores no saben si en verdad están ganando o perdiendo dinero.",
  "La contabilidad y los impuestos del SIN se ven complicados y dan miedo.",
  "Las herramientas que existen son caras, genéricas o pensadas para contadores, no para ti.",
];

const FEATURES = [
  {
    icon: Receipt,
    title: "Impuestos del SIN",
    body: "Calcula IVA, IT, IUE y te decimos qué régimen te conviene (RTS, SIETE-RG o General), con tu Cierre de Gestión real según tu rubro.",
  },
  {
    icon: TrendingUp,
    title: "Decisiones claras",
    body: "Precio justo, punto de equilibrio, estado de resultados y la salud de tu negocio, explicados en lenguaje simple y con colores.",
  },
  {
    icon: Building2,
    title: "Multi-negocio",
    body: "Maneja varios emprendimientos desde una sola cuenta, cada uno con sus propios datos, seguros y privados.",
  },
];

const VALUES = [
  { icon: Sparkles, title: "Claridad", body: "Explicamos en simple y con colores. Sin letra chica ni tecnicismos." },
  { icon: HeartHandshake, title: "Cercanía", body: "Pensamos como el emprendedor y hablamos su mismo idioma." },
  { icon: Lightbulb, title: "Educación", body: "No solo calculamos: enseñamos a decidir mejor sobre el negocio." },
  { icon: ShieldCheck, title: "Confianza", body: "Cuidamos los datos y la privacidad de cada usuario." },
  { icon: Palette, title: "Innovación", body: "Mejoramos el producto con cada aprendizaje y cada usuario." },
];

const PILLARS = [
  { label: "Entender", body: "Tus números, sin letra chica." },
  { label: "Controlar", body: "Cada peso, bajo tu mando." },
  { label: "Formalizar", body: "Al día con el SIN, sin miedo." },
  { label: "Crecer", body: "Decisiones que suman." },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
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
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-[0.15] blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--color-primary), transparent)" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="animate-reveal mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            Finanzas claras para el emprendedor boliviano
          </p>
          <h1 className="animate-reveal font-serif text-4xl italic leading-tight sm:text-6xl" style={{ animationDelay: "0.05s" }}>
            Finanzas claras,
            <br />
            negocios que crecen.
          </h1>
          <p
            className="animate-reveal mx-auto mt-6 max-w-xl text-lg text-foreground/60"
            style={{ animationDelay: "0.1s" }}
          >
            Una plataforma digital visual y explicativa que ayuda a los emprendedores y pequeños
            negocios de Bolivia a entender y controlar sus finanzas e impuestos, sin necesidad de
            saber de contabilidad.
          </p>
          <div
            className="animate-reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.15s" }}
          >
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
          <p
            className="animate-reveal mt-6 text-xs font-medium text-foreground/40"
            style={{ animationDelay: "0.2s" }}
          >
            Gratis · Sin tarjeta · Tus datos, siempre privados
          </p>
        </div>
      </header>

      {/* El problema */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              El problema que resolvemos
            </p>
            <h2 className="font-serif text-3xl italic leading-tight sm:text-4xl">
              Emprender ya es difícil.
              <br />
              Que los números también lo sean, no debería.
            </h2>
          </div>
          <div className="space-y-3">
            {PROBLEMS.map((p) => (
              <div
                key={p}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-black/5"
              >
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <Frown className="size-4" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/70">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            ¿Qué es ContadorAmigo?
          </p>
          <h2 className="font-serif text-3xl italic sm:text-4xl">Todo lo que necesitas, en un solo lugar</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-reveal group rounded-3xl bg-card p-7 ring-1 ring-black/5 transition-shadow hover:shadow-xl hover:shadow-black/5"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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

      {/* Visión */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="grid grid-cols-1 gap-8 rounded-3xl bg-primary/5 p-8 ring-1 ring-primary/10 sm:p-12 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Target className="size-8" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Nuestra visión · Meta al 2030
            </p>
            <p className="font-serif text-xl italic leading-relaxed sm:text-2xl">
              Ser la herramienta de gestión financiera de referencia para los emprendedores de
              Bolivia, impulsando la formalización y el crecimiento de miles de negocios mediante
              tecnología accesible y educación financiera práctica.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Nuestros valores
            </p>
            <h2 className="font-serif text-3xl italic sm:text-4xl">
              Los principios detrás de cada línea de la app
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl bg-background p-5 text-center ring-1 ring-black/5"
              >
                <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <v.icon className="size-5" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold">{v.title}</h3>
                <p className="text-xs leading-relaxed text-foreground/55">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Nuestro camino
          </p>
          <h2 className="font-serif text-3xl italic sm:text-4xl">Entender · Controlar · Formalizar · Crecer</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div
              key={p.label}
              className="rounded-2xl border border-border bg-card p-5 text-center"
            >
              <div className="mx-auto mb-2 grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </div>
              <p className="font-bold text-primary">{p.label}</p>
              <p className="mt-1 text-xs text-foreground/50">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Por qué confiar */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, text: "Tus datos son privados y seguros" },
            { icon: HandCoins, text: "Empieza gratis, sin tarjeta" },
            { icon: CheckCircle2, text: "Pensado 100% para Bolivia" },
          ].map((it) => (
            <div
              key={it.text}
              className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 ring-1 ring-black/5"
            >
              <it.icon className="size-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold text-foreground/70">{it.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: "radial-gradient(closest-side, var(--color-primary), transparent)" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
          <h2 className="font-serif text-3xl italic sm:text-4xl">¿Listo para ordenar tu negocio?</h2>
          <p className="mt-3 text-foreground/60">Gratis. Sin tarjeta. Empiezas en minutos.</p>
          <Link
            to="/registro"
            className="mt-6 inline-block rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-foreground/40 sm:px-6">
        Diseñado para el emprendedor boliviano · Tus datos son privados y seguros
      </footer>
    </div>
  );
}
