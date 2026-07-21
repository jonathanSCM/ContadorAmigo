import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth.server";
import { getMyBusiness } from "@/lib/businesses.server";

export const Route = createFileRoute("/negocio/$businessId")({
  // `beforeLoad` corre en CADA navegación sin importar staleTime (así está
  // diseñado: sirve para guards/redirects). Por eso solo dejamos ahí el
  // chequeo de sesión, que es barato. La búsqueda del negocio (una consulta
  // más pesada) va en `loader`, que sí respeta `staleTime` — con esto ya no
  // se vuelve a pedir el negocio al servidor en cada clic del menú.
  staleTime: Infinity,
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  loader: async ({ params }) => {
    const business = await getMyBusiness({ data: params.businessId });
    if (!business) throw redirect({ to: "/dashboard" });
    return { business };
  },
  component: NegocioLayout,
});

function NegocioLayout() {
  const { business } = Route.useLoaderData();
  return (
    <AppShell business={business}>
      <Outlet />
    </AppShell>
  );
}
