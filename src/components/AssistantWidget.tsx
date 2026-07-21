// Botón flotante + panel flotante del asistente de IA. Vive dentro de AppShell
// (que no se remonta al navegar entre pestañas), así que la conversación
// sigue viva mientras te mueves por el negocio. Se reinicia si cambias de
// negocio, cierras sesión o recargas la página — nunca se guarda en la base
// de datos, solo vive en memoria del navegador mientras estás en la sesión.
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { askAssistant, type ChatMessage } from "@/lib/assistant.server";
import { Bot, MessageCircle, Send, Sparkles, User, X } from "lucide-react";

const SUGGESTIONS = [
  "¿Cómo va mi negocio este mes?",
  "¿Qué régimen tributario me conviene?",
  "¿En qué estoy gastando más?",
];

export function AssistantWidget({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cambiaste de negocio: la conversación anterior ya no aplica.
  useEffect(() => {
    setMessages([]);
  }, [businessId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

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
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-black/10 sm:right-6">
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-serif text-lg italic">Tu asistente</p>
              <p className="text-[11px] opacity-70">{businessName}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="grid size-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <p className="text-xs text-foreground/60">
                  Pregúntame sobre tus finanzas o impuestos — no reemplazo a un contador.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/70 hover:border-primary/40 hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`grid size-6 shrink-0 place-items-center rounded-full ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                  }`}
                >
                  {m.role === "user" ? <User className="size-3" /> : <Bot className="size-3" />}
                </div>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${
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
              <div className="flex gap-2">
                <div className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Bot className="size-3" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5">
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
            className="flex shrink-0 items-center gap-2 border-t border-border p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-xs focus:border-primary/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="fixed bottom-5 right-4 z-[90] grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
