import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { askAssistant, type ChatMessage } from "@/lib/assistant.server";
import { Bot, Info, Send, Sparkles, User } from "lucide-react";

export const Route = createFileRoute("/negocio/$businessId/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente — ContadorAmigo" },
      {
        name: "description",
        content: "Pregúntale a tu asistente de IA sobre las finanzas reales de tu negocio.",
      },
    ],
  }),
  component: Asistente,
});

const SUGGESTIONS = [
  "¿Cómo va mi negocio este mes?",
  "¿Qué régimen tributario me conviene?",
  "¿En qué estoy gastando más?",
  "¿Cuánto voy a pagar de impuestos?",
];

function Asistente() {
  const { businessId } = Route.useParams();
  const { business } = useLoaderData({ from: "/negocio/$businessId" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await askAssistant({ data: { businessId, messages: next } });
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo contactar al asistente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-140px)] max-w-4xl flex-col p-4 sm:p-6">
      <header className="animate-reveal mb-4 shrink-0">
        <h1 className="font-serif text-3xl italic sm:text-4xl">Tu asistente financiero</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Pregúntale sobre {business.name}: usa tus números reales para responder.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary p-3 text-xs text-foreground/60">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>Es apoyo con IA para entender tus números — no reemplaza a un contador ni es asesoría legal oficial ante el SIN.</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-card p-4 ring-1 ring-black/5 sm:p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </div>
            <p className="max-w-sm text-sm text-foreground/60">
              Pregúntame lo que quieras sobre tus finanzas, impuestos o decisiones del negocio.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`grid size-8 shrink-0 place-items-center rounded-full ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
              }`}
            >
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <Bot className="size-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex shrink-0 items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm focus:border-primary/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </main>
  );
}
