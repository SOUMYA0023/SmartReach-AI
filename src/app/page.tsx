"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CampaignFunnel } from "@/components/dashboard/campaign-funnel";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { dashboardKpis } from "@/data/analytics";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Dashboard"
        subtitle="Marketing intelligence overview"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex-1 space-y-6 overflow-y-auto p-8"
      >
        <QuickActions />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {dashboardKpis.map((kpi, index) => (
            <KpiCard key={kpi.label} metric={kpi} index={index} />
          ))}
        </div>

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
