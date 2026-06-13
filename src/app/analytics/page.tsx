"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { cn, formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import {
  TrendingUp, IndianRupee, ShoppingCart, BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Tooltip components (kept exactly as before) ──────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; dataKey?: string; color?: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[2px] bg-white border border-border-subtle px-4 py-3 shadow-none">
      <p className="text-xs font-medium text-text-muted mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name || entry.dataKey}:</span>
          <span className="font-mono text-text-primary font-medium tabular-nums">
            {typeof entry.value === "number" && entry.value < 100 ? `${entry.value}%` : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[2px] bg-white border border-border-subtle px-4 py-3 shadow-none">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.fill }} />
        <span className="text-text-primary font-semibold">{payload[0].name}: {payload[0].value}%</span>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    refetchInterval: 30_000,
  });

  const { data: campaignData } = useQuery({
    queryKey: ["campaigns", { limit: 200 }],
    queryFn: () => api.getCampaigns({ limit: 200 }),
    refetchInterval: 30_000,
  });

  const campaigns = campaignData?.items ?? [];

  // Build revenue card data from live backend
  const totalCampaigns = dashboardData?.total_campaigns ?? 0;
  const avgOpenRate = dashboardData?.avg_open_rate ?? 0;
  const totalConverted = dashboardData?.total_converted ?? 0;
  const topChannel = dashboardData?.top_performing_channel ?? "—";

  // Aggregate channel metrics from campaigns
  const channelAgg: Record<string, { openTotal: number; ctrTotal: number; convTotal: number; count: number }> = {};
  for (const c of campaigns) {
    const ch = (c.channel ?? "email").toLowerCase();
    if (!channelAgg[ch]) channelAgg[ch] = { openTotal: 0, ctrTotal: 0, convTotal: 0, count: 0 };
    channelAgg[ch].openTotal += c.predicted_open_rate ?? 0;
    channelAgg[ch].ctrTotal += c.predicted_ctr ?? 0;
    channelAgg[ch].convTotal += c.predicted_conversion ?? 0;
    channelAgg[ch].count++;
  }
  const liveChannelMetrics = Object.entries(channelAgg).map(([ch, v]) => ({
    channel: ch.charAt(0).toUpperCase() + ch.slice(1),
    "Open Rate": Math.round(v.openTotal / v.count),
    CTR: Math.round(v.ctrTotal / v.count),
    "Conv Rate": Math.round(v.convTotal / v.count),
  }));
  const barData = liveChannelMetrics;

  // Segment distribution → pie chart
  const segDistribution = dashboardData?.segment_distribution ?? {};
  const totalSeg = Object.values(segDistribution).reduce((a, b) => a + b, 0) || 1;
  const COLORS = ["#2F855A", "#111110", "#6B6860", "#F5A623", "#B45309", "#9333EA", "#0EA5E9"];
  const segPieData = Object.entries(segDistribution).map(([name, val], i) => ({
    name,
    value: Math.round((val / totalSeg) * 100),
    fill: COLORS[i % COLORS.length],
  }));
  const pieData = segPieData;

  // Dynamic funnel calculation
  const totalSent = dashboardData?.total_sent ?? 0;
  const totalDelivered = dashboardData?.total_delivered ?? 0;
  const totalOpened = dashboardData?.total_opened ?? 0;
  const totalClicked = dashboardData?.total_clicked ?? 0;
  const totalConverted = dashboardData?.total_converted ?? 0;

  const funnelData = [
    {
      label: "Sent",
      value: totalSent,
      percentage: totalSent > 0 ? 100 : 0,
      color: "#F5A623",
    },
    {
      label: "Delivered",
      value: totalDelivered,
      percentage: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0,
      color: "#D99518",
    },
    {
      label: "Opened",
      value: totalOpened,
      percentage: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
      color: "#BFBCB4",
    },
    {
      label: "Clicked",
      value: totalClicked,
      percentage: totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0,
      color: "#8F8B82",
    },
    {
      label: "Converted",
      value: totalConverted,
      percentage: totalSent > 0 ? Math.round((totalConverted / totalSent) * 1000) / 10 : 0,
      color: "#111110",
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Analytics"
        subtitle={isLoading ? "Loading live analytics…" : "Campaign performance & insights"}
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Revenue Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Total Campaigns",
              value: formatNumber(totalCampaigns),
              change: 0,
              icon: IndianRupee,
              color: "text-text-muted",
            },
            {
              label: "Avg Open Rate",
              value: formatPercentage(avgOpenRate),
              change: 0,
              icon: ShoppingCart,
              color: "text-[var(--color-signal)]",
            },
            {
              label: "Total Converted",
              value: formatNumber(totalConverted),
              change: 0,
              sublabel: "customers",
              icon: TrendingUp,
              color: "text-success",
            },
            {
              label: "Top Channel",
              value: topChannel,
              change: 0,
              icon: BarChart3,
              color: "text-warning",
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              className="group rounded-[2px] border border-[var(--color-border)] bg-white p-5 transition-colors duration-150 hover:border-[#BFBCB4]"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{card.label}</p>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <p className="font-mono text-2xl font-medium text-text-primary tabular-nums">{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {card.change > 0 && (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-success" />
                    <span className="font-mono text-xs text-[var(--color-signal)]">+{card.change}%</span>
                  </>
                )}
                {car        {/* Funnel (from campaign data) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
        >
          <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Conversion Funnel</h3>
          <p className="text-xs text-text-muted mb-6">Aggregate campaign performance</p>

          {totalSent === 0 ? (
            <div className="flex h-40 items-center justify-center border border-dashed border-border-subtle rounded-[2px]">
              <p className="text-sm text-text-muted">No campaign data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-4 h-40">
              {funnelData.map((step, index) => (
                <div key={step.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    {formatNumber(step.value)}
                  </span>
                  <motion.div
                    className="w-full rounded-[2px]"
                    style={{ background: step.color }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(step.percentage / 100) * 140}px` }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                  <span className="text-[10px] text-text-muted">{step.label}</span>
                  <span className="text-[10px] font-medium text-text-primary">{step.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Channel Performance</h3>
            <p className="text-xs text-text-muted mb-5">Live predicted rates by channel</p>
            
            {barData.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center border border-dashed border-border-subtle rounded-[2px]">
                <p className="text-sm text-text-muted">No campaign data yet</p>
              </div>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E0DDD6" vertical={false} />
                    <XAxis dataKey="channel" tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Open Rate" fill="#111110" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="CTR" fill="#F5A623" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Conv Rate" fill="#6B6860" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Segment Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Customer Segments</h3>
            <p className="text-xs text-text-muted mb-4">Live segment distribution</p>

            {pieData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center border border-dashed border-border-subtle rounded-[2px]">
                <p className="text-sm text-text-muted">No customer data yet</p>
              </div>
            ) : (
              <>
                <div className="h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text-primary">
                        {formatNumber(dashboardData?.total_customers ?? 0)}
                      </p>
                      <p className="text-[10px] text-text-muted">Total Customers</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                      <span className="text-text-muted">{item.name}</span>
                      <span className="text-text-primary font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
