"use client";

import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Ticker } from "@/components/layout/ticker";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
      className="flex h-[52px] shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-white px-6"
    >
      {/* Left: Title */}
      <div className="shrink-0">
        <h2 className="font-display text-[17px] tracking-[-0.02em] text-[var(--color-ink)]">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-[10px] text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>

      {/* Center: Ticker */}
      <Ticker />

      {/* Right: Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <button className="rounded-[2px] border border-[var(--color-border)] bg-white px-3 py-[5px] font-body text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-ink)]">
          Search
        </button>

        <button className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="flex items-center gap-1.5 rounded-[2px] border border-[rgba(124,58,237,0.3)] bg-transparent px-2.5 py-1 font-body text-[11px] text-[#7C3AED]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7C3AED]" />
          AI Online
        </div>
      </div>
    </motion.header>
  );
}
