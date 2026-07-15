// Metas de ahorro y fondo de emergencia (localStorage).
import { bizKey } from "./profiles";

export interface Goals {
  savingsLabel: string;
  savingsTarget: number; // meta de ahorro/reinversión (Bs)
  emergencyMonths: number; // meses de costos fijos a cubrir con el fondo
}

const key = () => bizKey("goals");

const DEFAULT: Goals = {
  savingsLabel: "Horno de convección nuevo",
  savingsTarget: 8000,
  emergencyMonths: 3,
};

export function loadGoals(): Goals {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(key());
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Goals>) };
  } catch {
    return DEFAULT;
  }
}

export function saveGoals(g: Goals): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(), JSON.stringify(g));
}
