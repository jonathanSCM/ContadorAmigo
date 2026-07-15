// Gestión de múltiples negocios (perfiles). Cada negocio guarda sus datos
// (movimientos, NIT, productos, metas) en un espacio de claves separado.

export interface Business {
  id: string;
  name: string;
  createdAt: string;
}

interface Registry {
  list: Business[];
  activeId: string;
}

const REG_KEY = "contadoramigo:businesses:v1";
const PREFIX = "contadoramigo:b:";

// Claves de la versión anterior (un solo negocio) — se migran al primer negocio.
const LEGACY = {
  movements: "contadoramigo:movements:v1",
  nit: "contadoramigo:nit:v1",
  products: "contadoramigo:products:v1",
  goals: "contadoramigo:goals:v1",
};

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function bizKeyFor(id: string, suffix: string): string {
  return `${PREFIX}${id}:${suffix}`;
}

function readReg(): Registry | null {
  try {
    const raw = localStorage.getItem(REG_KEY);
    return raw ? (JSON.parse(raw) as Registry) : null;
  } catch {
    return null;
  }
}
function writeReg(r: Registry): void {
  localStorage.setItem(REG_KEY, JSON.stringify(r));
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function migrate(from: string, to: string): void {
  const v = safeGet(from);
  if (v === null) return;
  if (localStorage.getItem(to) === null) localStorage.setItem(to, v);
  localStorage.removeItem(from);
}

/** Crea el registro si no existe, migrando datos antiguos al primer negocio. */
function ensureInit(): Registry {
  const existing = readReg();
  if (existing && existing.list.length) return existing;

  const id = uuid();
  let name = "Mi negocio";

  const oldMovs = safeGet(LEGACY.movements);
  if (oldMovs) {
    try {
      const arr = JSON.parse(oldMovs) as { id: string }[];
      if (
        Array.isArray(arr) &&
        arr.length > 0 &&
        arr.every((m) => String(m.id).startsWith("demo-"))
      ) {
        name = "Dulce Illimani";
      }
    } catch {
      /* ignore */
    }
    migrate(LEGACY.movements, bizKeyFor(id, "movements"));
    migrate(LEGACY.nit, bizKeyFor(id, "nit"));
    migrate(LEGACY.products, bizKeyFor(id, "products"));
    migrate(LEGACY.goals, bizKeyFor(id, "goals"));
  }

  const reg: Registry = {
    list: [{ id, name, createdAt: new Date().toISOString() }],
    activeId: id,
  };
  writeReg(reg);
  return reg;
}

export function activeId(): string {
  if (typeof window === "undefined") return "server";
  return ensureInit().activeId;
}

/** Clave namespaced del negocio activo (movements, nit, products, goals). */
export function bizKey(suffix: string): string {
  return bizKeyFor(activeId(), suffix);
}

export function listBusinesses(): Business[] {
  if (typeof window === "undefined") return [];
  return ensureInit().list;
}

export function activeBusiness(): Business | null {
  if (typeof window === "undefined") return null;
  const r = ensureInit();
  return r.list.find((b) => b.id === r.activeId) ?? r.list[0] ?? null;
}

export function switchBusiness(id: string): void {
  const r = ensureInit();
  if (r.list.some((b) => b.id === id)) {
    r.activeId = id;
    writeReg(r);
  }
}

export function addBusiness(name: string): Business {
  const r = ensureInit();
  const b: Business = {
    id: uuid(),
    name: name.trim() || "Nuevo negocio",
    createdAt: new Date().toISOString(),
  };
  r.list.push(b);
  r.activeId = b.id;
  writeReg(r);
  // Inicializa datos vacíos para que el negocio nuevo NO cargue el ejemplo.
  localStorage.setItem(bizKeyFor(b.id, "movements"), "[]");
  localStorage.setItem(bizKeyFor(b.id, "products"), "[]");
  return b;
}

export function renameBusiness(id: string, name: string): void {
  const r = ensureInit();
  const b = r.list.find((x) => x.id === id);
  if (b && name.trim()) {
    b.name = name.trim();
    writeReg(r);
  }
}

export function deleteBusiness(id: string): void {
  const r = ensureInit();
  if (r.list.length <= 1) return; // siempre debe quedar al menos uno
  r.list = r.list.filter((b) => b.id !== id);
  if (r.activeId === id) r.activeId = r.list[0].id;
  writeReg(r);
  ["movements", "nit", "products", "goals"].forEach((s) =>
    localStorage.removeItem(bizKeyFor(id, s)),
  );
}
