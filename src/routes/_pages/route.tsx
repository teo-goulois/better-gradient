import { SharedFooter } from "@/components/shared/shared-footer";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
      <SharedFooter />
    </div>
  );
}
