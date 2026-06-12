"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Megaphone,
  BarChart3,
  BookOpen,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "AI Workspace", href: "/ai-workspace", icon: Sparkles, accent: true },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Intelligence Hub", href: "/knowledge", icon: BookOpen },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-sidebar z-10 flex h-screen w-[220px] shrink-0 flex-col"
      style={{ backgroundColor: "#111110" }}
    >
      {/* Logo */}
      <div className="border-b border-white/[0.08] px-4 pb-3.5 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] bg-white">
            <Zap className="h-4 w-4 text-[#111110]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base tracking-[-0.02em] text-white">
              SmartReach AI
            </h1>
            <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.1em] text-white/35">
              Marketing Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-2.5 border-l-2 py-[9px] pl-4 pr-4 font-body text-[13px] transition-all duration-150 ease-out",
                  isActive
                    ? "border-[#F5A623] text-white"
                    : "border-transparent text-white/45 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
                {item.accent && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-white/[0.08] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/10 font-body text-xs text-white">
            SS
          </div>
          <div className="min-w-0">
            <p className="truncate font-body text-xs text-white/55">Soumya Sumankar</p>
            <p className="font-body text-[10px] uppercase tracking-[0.08em] text-white/30">
              Growth Ops
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
