"use client";

import { Logo } from "@/components/shared/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { MeshSidebarColor } from "./mesh-sidebar-color";
import { MeshSidebarFilter } from "./mesh-sidebar-filter";
import { MeshSidebarSize } from "./mesh-sidebar-size";

export const MeshSidebar = () => {
  return (
    <ScrollArea
      style={{ position: "fixed" }}
      className="w-64 min-h-0 h-[calc(100vh-2rem)] fixed left-4 top-4 rounded-xl bg-white  z-50 "
    >
      <div className="h-full pt-4">
        <Link to="/" className="px-4 py-1 inline-block">
          <Logo />
        </Link>
        <MeshSidebarColor />
        <MeshSidebarFilter />
        <MeshSidebarSize />
      </div>
    </ScrollArea>
  );
};
