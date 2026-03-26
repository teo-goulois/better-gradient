"use client";

import { Logo } from "@/components/shared/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { AuthInlineCta } from "@/components/gradients/product-shell";
import { authClient } from "@/lib/auth-client";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { FAVORITES_DASHBOARD_HREF } from "@/lib/dashboard";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MeshSidebarColor } from "./mesh-sidebar-color";
import { MeshSidebarFilter } from "./mesh-sidebar-filter";
import { MeshSidebarSize } from "./mesh-sidebar-size";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const MeshSidebar = () => {
  const viewerQuery = useQuery(getViewerQueryOptions());
  const viewer = viewerQuery.data?.user ?? null;

  return (
    <div className="w-64 min-h-0 h-[calc(100vh-2rem)] fixed left-4 top-4 rounded-xl bg-white z-50 flex flex-col">
      <ScrollArea type="scroll" className="flex-1 min-h-0">
        <div className="pt-4">
          <Link to="/" className="px-4 py-1 inline-block">
            <Logo />
          </Link>
          <MeshSidebarColor />
          <MeshSidebarFilter />
          <MeshSidebarSize />
        </div>
      </ScrollArea>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-neutral-100 p-3">
        {viewer ? (
          <Menu>
            <MenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-50">
              {viewer.image ? (
                <img
                  src={viewer.image}
                  alt={viewer.name}
                  className="size-8 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {initials(viewer.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {viewer.name}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {viewer.email}
                </p>
              </div>
              <svg
                className="size-4 shrink-0 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                />
              </svg>
            </MenuTrigger>
            <MenuContent placement="top start" className="min-w-56">
              <MenuItem href="/dashboard">Dashboard</MenuItem>
              <MenuItem href={FAVORITES_DASHBOARD_HREF}>Favorites</MenuItem>
              <MenuItem href="/leaderboard">Leaderboard</MenuItem>
              <MenuItem
                isDanger
                onAction={() => {
                  void authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/";
                      },
                    },
                  });
                }}
              >
                Log out
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : (
          <div className="flex flex-col gap-2">
            <AuthInlineCta next="/editor" label="Sign in with Google" />
          </div>
        )}
      </div>
    </div>
  );
};
