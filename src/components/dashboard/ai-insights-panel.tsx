"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const insights = [
  {
    title: "Repeat purchase drop detected",
    description:
      "23% decline in repeat purchases from the Beauty segment over the last 14 days. Consider a targeted retention campaign.",
  },
  {
    title: "High-performing channel identified",
    description:
      "WhatsApp campaigns are outperforming email by 3.2x in CTR this month. Shift budget allocation for upcoming campaigns.",
  },
  {
    title: "Churn risk in Loyal segment",
    description:
      "12 customers from the Loyal segment show declining engagement scores. Intervene within 14 days to prevent segment migration.",
  },
];

export function AiInsightsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
      className="rounded-l-none rounded-r-[2px] border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-ai)] bg-white px-[18px] py-4 transition-colors duration-150 hover:border-[#BFBCB4] hover:border-l-[var(--color-ai)]"
    >
      <div className="mb-3.5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--color-ai)]" />
        <div>
          <h3 className="font-body text-xs font-semibold text-[var(--color-ink)]">
            AI Insights
          </h3>
          <p className="font-body text-[10px] text-[var(--color-muted)]">
            Detected from your customer data
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.08, duration: 0.2 }}
            className="flex gap-2"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ai)]" />
            <div>
              <p className="font-body text-xs leading-normal text-[var(--color-ink)]">
                {insight.title}
              </p>
              <p className="mt-1 font-body text-xs leading-relaxed text-[var(--color-muted)]">
                {insight.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
