import { useEffect, useState } from "react";
import { BarChart3, PiggyBank, Receipt, Sparkles } from "lucide-react";

const KEY = "contadoramigo:onboarded:v1";

const STEPS = [
  {
    icon: Sparkles,
    title: "¡Bienvenido a ContadorAmigo!",
    body: "La forma simple y visual de entender las finanzas de tu negocio, sin necesidad de saber de contabilidad. Cargamos un negocio de ejemplo para que explores; puedes borrarlo cuando quieras.",
  },
  {
    icon: PiggyBank,
    title: "Registra tus ventas y gastos",
    body: "En «Movimientos» anotas lo que entra y lo que sale. Todo se guarda solo en tu navegador. El «Panel» te muestra al instante tu utilidad, tu saldo y la salud de tu negocio con un semáforo.",
  },
  {
    icon: Receipt,
    title: "Impuestos sin susto",
    body: "En «Impuestos» calculamos tu IVA, IT e IUE y te recomendamos el régimen boliviano que más te conviene (Simplificado, SIETE-RG o General), según tu tamaño.",
  },
  {
    icon: BarChart3,
    title: "Decide con datos",
    body: "En «Productos» calculas el precio justo y tu punto de equilibrio; en «Análisis» ves tu estado de resultados y tus metas. ¡Listo para empezar!",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  if (!open) return null;

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="flex flex-col items-center bg-primary px-8 pb-6 pt-10 text-center text-primary-foreground">
          <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-white/15">
            <Icon className="size-8" />
          </div>
          <h2 className="font-serif text-2xl italic">{s.title}</h2>
        </div>
        <div className="p-8">
          <p className="text-center text-sm leading-relaxed text-foreground/70">{s.body}</p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-foreground/15"
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={finish}
              className="text-sm font-medium text-foreground/50 hover:text-foreground"
            >
              Saltar
            </button>
            <button
              onClick={() => (last ? finish() : setStep((v) => v + 1))}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {last ? "Comenzar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
