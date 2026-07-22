// Caché en memoria del cliente para llamadas a server functions de solo lectura
// (listMovements, listProducts, etc). Sin esto, cada vez que se navega entre
// pestañas (Panel, Movimientos, Productos...) el componente se remonta y vuelve
// a pedir los mismos datos a la base de datos remota (Turso), lo que se siente
// lento. Con la caché, si ya se pidieron hace poco, se reusan al instante.
const cache = new Map<string, { data: unknown; expires: number }>();

const DEFAULT_TTL_MS = 30_000;

export async function cachedCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}
