import * as Popover from "@radix-ui/react-popover";
import { findConcept } from "@/lib/concepts";
import { HelpCircle } from "lucide-react";

export function ConceptPopover({
  conceptKey,
  label,
  variant = "default",
}: {
  conceptKey: string;
  label?: string;
  variant?: "default" | "on-primary";
}) {
  const c = findConcept(conceptKey);
  if (!c) return null;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={
            variant === "on-primary"
              ? "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 transition-opacity hover:text-primary-foreground"
              : "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary/70 transition-opacity hover:text-primary"
          }
        >
          <HelpCircle className="size-3" />
          {label ?? "¿Qué es?"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Concepto
          </p>
          <h4 className="mb-2 font-serif text-lg italic">{c.term}</h4>
          <p className="text-sm leading-relaxed text-foreground/80">{c.full}</p>
          {c.example && (
            <div className="mt-3 rounded-lg bg-secondary p-3 text-xs text-foreground/70">
              <span className="font-bold text-foreground">Ejemplo: </span>
              {c.example}
            </div>
          )}
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
