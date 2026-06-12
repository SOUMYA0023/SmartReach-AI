"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { timeSeriesData } from "@/data/analytics";
import { cn } from "@/lib/utils";

type MetricKey = "openRate" | "ctr" | "conversions";

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: "openRate", label: "Open Rate", color: "#111110" },
  { key: "ctr", label: "CTR", color: "#F5A623" },
  { key: "conversions", label: "Conversions", color: "#888780" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[2px] border border-[var(--color-border)] bg-white px-3 py-2">
      <p className="mb-1.5 font-body text-[10px] text-[var(--color-muted)]">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="font-mono text-xs font-medium text-[var(--color-ink)] tabular-nums"
        >
          {entry.dataKey === "conversions" ? entry.value : `${entry.value}%`}
        </p>
      ))}
    </div>
  );
}

export function PerformanceTrends() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("openRate");
  const activeColor = metrics.find((m) => m.key === activeMetric)?.color || "#111110";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3, ease: "easeOut" }}
      className="rounded-[2px] border border-[var(--color-border)] bg-white px-[18px] py-4 transition-colors duration-150 hover:border-[#BFBCB4]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-body text-xs font-semibold text-[var(--color-ink)]">
            Performance Trends
          </h3>
          <p className="font-body text-[10px] text-[var(--color-muted)]">Last 30 days</p>
        </div>
        <div className="flex gap-4 border-b border-[var(--color-border)]">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={cn(
                "border-b-2 px-0 pb-2 font-body text-xs transition-colors duration-150",
                activeMetric === m.key
                  ? "border-[var(--color-ink)] font-medium text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E0DDD6"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={activeColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive
              animationDuration={1000}
              animationBegin={700}
              activeDot={{
                r: 3,
                fill: activeColor,
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
