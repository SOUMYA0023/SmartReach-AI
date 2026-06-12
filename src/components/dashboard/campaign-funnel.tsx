"use client";

import { motion } from "framer-motion";
import { funnelData } from "@/data/analytics";
import { formatNumber } from "@/lib/utils";

const fills = ["#111110", "#3A3A38", "#888780", "#B4B2A9", "#F5A623"];

export function CampaignFunnel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
      className="rounded-[2px] border border-[var(--color-border)] bg-white px-[18px] py-4 transition-colors duration-150 hover:border-[#BFBCB4]"
    >
      <h3 className="font-body text-xs font-semibold text-[var(--color-ink)]">
        Campaign Funnel
      </h3>
      <p className="mb-3.5 font-body text-[10px] text-[var(--color-muted)]">
        Last 30 days aggregate performance
      </p>

      <div className="space-y-3.5">
        {funnelData.map((step, index) => (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-body text-[11px] text-[var(--color-muted)]">
                {step.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--color-ink)] tabular-nums">
                  {formatNumber(step.value)}
                </span>
                <span className="font-mono text-[11px] text-[var(--color-muted)] tabular-nums">
                  ({step.percentage}%)
                </span>
              </div>
            </div>
            <div className="h-[3px] min-h-[3px] max-h-[3px] w-full overflow-hidden rounded-none bg-[#F0EDE8] leading-none">
              <motion.div
                className="block rounded-none"
                style={{
                  background: fills[index] || "#111110",
                  height: "3px",
                  maxHeight: "3px",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${step.percentage}%` }}
                transition={{
                  delay: 0.6 + index * 0.08,
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
