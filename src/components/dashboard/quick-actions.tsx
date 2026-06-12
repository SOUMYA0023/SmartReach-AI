"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Plus, Users } from "lucide-react";

const actions = [
  {
    label: "AI Workspace",
    description: "Generate campaign with AI",
    href: "/ai-workspace",
    variant: "ai" as const,
  },
  {
    label: "New Campaign",
    description: "Create manually",
    href: "/campaigns",
    variant: "secondary" as const,
  },
  {
    label: "View Segments",
    description: "Explore audiences",
    href: "/customers",
    variant: "secondary" as const,
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
      className="flex gap-2"
    >
      {actions.map((action) => {
        const Icon = action.label === "AI Workspace" ? Sparkles : action.label === "New Campaign" ? Plus : Users;
        const isAi = action.variant === "ai";

        return (
          <Link key={action.label} href={action.href} className="flex-1">
            {isAi ? (
              <div className="flex cursor-pointer items-center gap-3.5 rounded-[2px] border border-[#E0DDD6] bg-white px-5 py-4 transition-[border-color] duration-150 hover:border-[rgba(124,58,237,0.4)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-[rgba(124,58,237,0.2)] bg-[#F5F0FF]">
                  <Sparkles className="h-[18px] w-[18px] text-[#7C3AED]" />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-[#111110]">
                    {action.label}
                  </p>
                  <p className="font-body text-[11px] text-[#6B6860]">
                    {action.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex cursor-pointer items-center gap-3.5 rounded-[2px] border border-[#E0DDD6] bg-white px-5 py-4 transition-[border-color] duration-150 hover:border-[#BFBCB4]">
                <Icon className="h-4 w-4 shrink-0 text-[#6B6860]" />
                <div>
                  <p className="font-body text-[13px] font-medium text-[#111110]">
                    {action.label}
                  </p>
                  <p className="font-body text-[11px] text-[#6B6860]">
                    {action.description}
                  </p>
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </motion.div>
  );
}
