import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { ToastProvider } from "../components/ui/Toast";
import NotificationListener from "../components/layout/NotificationListener";

export default function AppLayout() {
  // On mobile: true = drawer closed, false = drawer open
  // On desktop: true = collapsed to icons, false = full width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();

  return (
    <ToastProvider>
      <NotificationListener />
      <div className="min-h-screen bg-[#06060a] text-white">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed((current) => !current)}
        />

        <Topbar
          onMenuClick={() => setSidebarCollapsed((current) => !current)}
        />

        <main
          className={`min-h-screen pt-20 transition-all duration-300 ${
            sidebarCollapsed ? "md:pl-[78px]" : "md:pl-[260px]"
          }`}
        >
          <div className="p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}