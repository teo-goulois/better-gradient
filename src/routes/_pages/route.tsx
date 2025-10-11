import { SharedFooter } from "@/components/shared/shared-footer";
import { SharedNavbar } from "@/components/shared/shared-navbar";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <SharedNavbar />
      <Outlet />
      <SharedFooter />
    </div>
  );
}
