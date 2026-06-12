"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { KpiMetric } from "@/types";

function useCountUp(end: number, duration: number = 800, delay: number = 0) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    timeoutId = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
      startTime.current = null;
    };
  }, [end, duration, delay]);

  return value;
}

function KpiValue({ metric, delay }: { metric: KpiMetric; delay: number }) {
  const animatedValue = useCountUp(metric.value, 800, delay);

  if (metric.format === "currency") return <>{formatCurrency(animatedValue)}</>;
  if (metric.format === "percentage") return <>{formatPercentage(animatedValue)}</>;
  return <>{formatNumber(Math.round(animatedValue))}</>;
}

export function KpiCard({ metric, index }: { metric: KpiMetric; index: number }) {
  const isPositive = metric.change >= 0;
  const countDelay = 200 + index * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-[2px] border border-[var(--color-border)] bg-white px-3 py-3.5",
        "cursor-default transition-colors duration-150 hover:border-[#BFBCB4]"
      )}
    >
      <p className="mb-2 font-body text-[9px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {metric.label}
      </p>
      <p className="font-mono text-[24px] font-medium tracking-[-0.02em] text-[#111110] tabular-nums">
        <KpiValue metric={metric} delay={countDelay} />
      </p>
      {metric.change !== 0 && (
        <motion.span
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "mt-2 inline-flex rounded-[2px] px-[5px] py-0.5 font-mono text-[9px] tabular-nums",
            isPositive
              ? "bg-[var(--color-signal-dim)] text-[#7A5200]"
              : "bg-[#FFECEC] text-[var(--color-negative)]"
          )}
        >
          {isPositive ? "+" : ""}
          {metric.change}%
        </motion.span>
      )}
    </motion.div>
  );
}
