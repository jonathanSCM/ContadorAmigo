import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth.server";
import { getMyBusiness } from "@/lib/businesses.server";

export const Route = createFileRoute("/negocio/$businessId")({
  beforeLoad: async ({ params }) => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
    const business = await getMyBusiness({ data: params.businessId });
    if (!business) throw redirect({ to: "/dashboard" });
    return { user, business };
  },
  component: NegocioLayout,
});

function NegocioLayout() {
  const { business } = Route.useRouteContext();
  return (
    <AppShell business={business}>
      <Outlet />
    </AppShell>
  );
}
