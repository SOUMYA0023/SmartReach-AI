"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CampaignFunnel } from "@/components/dashboard/campaign-funnel";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KpiMetric } from "@/types";

function buildKpisFromDashboard(data: {
  total_customers: number;
  total_campaigns: number;
  avg_open_rate: number;
  total_converted: number;
  top_performing_channel: string;
  segment_distribution: Record<string, number>;
}): KpiMetric[] {
  const totalSegments = Object.keys(data.segment_distribution).length;
  return [
    { label: "Total Customers", value: data.total_customers, change: 0, changeLabel: "registered", format: "number", icon: "Users" },
    { label: "Active Segments", value: totalSegments, change: 0, changeLabel: "segments tracked", format: "number", icon: "Target" },
    { label: "Total Campaigns", value: data.total_campaigns, change: 0, changeLabel: "campaigns created", format: "number", icon: "Send" },
    { label: "Avg Open Rate", value: Math.round(data.avg_open_rate * 10) / 10, change: 0, changeLabel: "across campaigns", format: "percentage", icon: "Eye" },
    { label: "Total Converted", value: data.total_converted, change: 0, changeLabel: "conversions", format: "number", icon: "MousePointerClick" },
    { label: "Top Channel", value: 0, change: 0, changeLabel: data.top_performing_channel || "—", format: "number", icon: "IndianRupee" },
  ];
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    refetchInterval: 30_000,
  });

  const dashboardKpis: KpiMetric[] = dashboardData
    ? buildKpisFromDashboard(dashboardData)
    : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Dashboard"
        subtitle={
          isLoading
            ? "Loading live data…"
            : isError
            ? "Could not reach backend"
            : "Marketing intelligence overview"
        }
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex-1 space-y-6 overflow-y-auto p-8"
      >
        <QuickActions />

        {isLoading ? (
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[2px] border border-[var(--color-border)] bg-white px-2.5 py-3 h-20"
              />
            ))}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {dashboardKpis.map((kpi, index) => (
              <KpiCard key={kpi.label} metric={kpi} index={index} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CampaignFunnel />
          <PerformanceTrends />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentCampaigns />
          <AiInsightsPanel />
        </div>
      </motion.div>
    </div>
  );
}
