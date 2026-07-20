import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getCurrentUser, loginUser } from "@/lib/auth.server";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Iniciar sesión — ContadorAmigo" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser({ data: { email, password } });
      toast.success("¡Bienvenido de nuevo!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="font-serif text-xl italic font-semibold tracking-tight">
            ContadorAmigo
          </span>
        </Link>

        <div className="rounded-3xl bg-card p-8 ring-1 ring-black/5">
          <h1 className="mb-1 font-serif text-2xl italic">Inicia sesión</h1>
          <p className="mb-6 text-sm text-foreground/60">
            Entra para ver tus emprendimientos.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
                Correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase text-foreground/50">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-foreground/60">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-bold text-primary hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
