"use client";

import { Logo } from "@/components/shared/logo";
import { Link } from "@tanstack/react-router";
import { MeshSidebarColor } from "./mesh-sidebar-color";
import { MeshSidebarFilter } from "./mesh-sidebar-filter";
import { MeshSidebarSize } from "./mesh-sidebar-size";

export const MeshSidebar = () => {
  return (
    <div className="w-64 h-[calc(100vh-2rem)] fixed overflow-y-auto left-4 top-4 rounded-xl bg-white pt-4 z-50 ">
      <Link to="/" className="px-4 py-1 inline-block">
        <Logo />
      </Link>
      <MeshSidebarColor />
      <MeshSidebarFilter />
      <MeshSidebarSize />
    </div>
  );
};
