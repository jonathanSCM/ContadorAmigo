import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CONCEPTS } from "@/lib/concepts";

export const Route = createFileRoute("/aprender")({
  head: () => ({
    meta: [
      { title: "Aprender contabilidad — ContadorAmigo" },
      {
        name: "description",
        content:
          "Diccionario de contabilidad boliviana: IVA, IT, IUE, NIT, crédito fiscal, débito fiscal y más. Explicado simple.",
      },
    ],
  }),
  component: Aprender,
});

function Aprender() {
  const [q, setQ] = useState("");
  const filtered = CONCEPTS.filter(
    (c) =>
      c.term.toLowerCase().includes(q.toLowerCase()) ||
      c.short.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <header className="mb-8 animate-reveal">
          <h1 className="font-serif text-4xl italic">Aprender contabilidad</h1>
          <p className="mt-2 max-w-2xl text-foreground/60">
            Cada término explicado en lenguaje simple, pensado para el emprendedor boliviano. Sin
            tecnicismos innecesarios.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un término..."
            className="mt-6 w-full rounded-full border border-border bg-card px-6 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((c, i) => (
            <article
              key={c.key}
              className="animate-reveal rounded-3xl bg-card p-6 ring-1 ring-black/5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                {c.term.split("—")[0].trim()}
              </p>
              <h3 className="mb-2 font-serif text-2xl italic">{c.term}</h3>
              <p className="mb-3 text-sm font-medium text-foreground/80">{c.short}</p>
              <p className="text-sm leading-relaxed text-foreground/70">{c.full}</p>
              {c.example && (
                <div className="mt-4 rounded-xl bg-secondary p-3 text-xs">
                  <span className="font-bold text-primary">Ejemplo · </span>
                  <span className="text-foreground/70">{c.example}</span>
                </div>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 rounded-3xl border-2 border-dashed border-border p-8 text-center text-sm text-foreground/50">
              No encontramos ese término. Prueba con "IVA", "utilidad" o "NIT".
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
