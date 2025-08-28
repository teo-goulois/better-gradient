"use client";

import { Logo } from "@/components/shared/logo";
import { Link } from "@tanstack/react-router";
import { SidebarColor } from "./sidebar-color";
import { SidebarFilter } from "./sidebar-filter";
import { SidebarSize } from "./sidebar-size";

export const MeshSidebar = () => {
  return (
    <div className="w-64 h-[calc(100vh-2rem)] fixed overflow-y-auto left-4 top-4 rounded-xl bg-white pt-4  z-50 ">
      <Link to="/" className="px-4 py-1 inline-block">
        <Logo />
      </Link>
      <SidebarColor />
      <SidebarFilter />
      <SidebarSize />
    </div>
  );
};
