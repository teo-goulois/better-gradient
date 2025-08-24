"use client";

import { SidebarColor } from "./sidebar-color";
import { SidebarFilter } from "./sidebar-filter";
import { SidebarSize } from "./sidebar-size";

type Props = {};

export const MeshSidebar = ({}: Props) => {
  return (
    <div className="w-64 h-[calc(100vh-2rem)] fixed overflow-y-auto left-4 top-4 rounded-xl bg-white pt-4  z-50 ">
      <SidebarColor />
      <SidebarFilter />
      <SidebarSize />
    </div>
  );
};
