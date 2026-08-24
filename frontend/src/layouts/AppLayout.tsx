import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() =>
          setSidebarCollapsed(
            (current) => !current,
          )
        }
      />

      <Topbar
        onMenuClick={() =>
          setSidebarCollapsed(
            (current) => !current,
          )
        }
      />

      <main
        className={`min-h-screen pt-20 transition-all duration-300 ${
          sidebarCollapsed
            ? "md:pl-[78px]"
            : "md:pl-[260px]"
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}