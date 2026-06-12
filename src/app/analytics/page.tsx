"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { funnelData, timeSeriesData, channelMetrics, channelMixData, revenueData } from "@/data/analytics";
import { cn, formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import {
  TrendingUp, IndianRupee, ShoppingCart, BarChart3,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; dataKey?: string; color?: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[2px] bg-white border border-border-subtle px-4 py-3 shadow-none">
      <p className="text-xs font-medium text-text-muted mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name || entry.dataKey}:</span>
          <span className="font-mono text-text-primary font-medium tabular-nums">{typeof entry.value === "number" && entry.value < 100 ? `${entry.value}%` : formatNumber(entry.value)}</span>
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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");
  const chartData = timeRange === "7d" ? timeSeriesData.slice(-7) : timeSeriesData;

  const barData = channelMetrics.map((c) => ({
    channel: c.channel,
    "Open Rate": Math.round((c.opened / c.delivered) * 100),
    CTR: Math.round((c.clicked / c.delivered) * 100),
    "Conv Rate": Math.round((c.converted / c.delivered) * 100),
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Analytics" subtitle="Campaign performance & insights" />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Revenue Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Total Revenue Influenced",
              value: formatCurrency(revenueData.totalRevenue),
              change: revenueData.revenueGrowth,
              icon: IndianRupee,
              color: "text-text-muted",
            },
            {
              label: "Avg Order Value",
              value: formatCurrency(revenueData.avgOrderValue),
              change: revenueData.aovChange,
              icon: ShoppingCart,
              color: "text-[var(--color-signal)]",
            },
            {
              label: "Top Segment Revenue",
              value: formatCurrency(revenueData.topSegmentRevenue.revenue),
              change: 0,
              sublabel: revenueData.topSegmentRevenue.segment,
              icon: TrendingUp,
              color: "text-success",
            },
            {
              label: "Top Channel Revenue",
              value: formatCurrency(revenueData.topChannelRevenue.revenue),
              change: 0,
              sublabel: revenueData.topChannelRevenue.channel,
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
                {card.sublabel && (
                  <span className="text-xs text-text-muted">{card.sublabel}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
        >
          <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Conversion Funnel</h3>
          <p className="text-xs text-text-muted mb-6">Aggregate campaign performance funnel</p>

          <div className="flex items-end gap-4 h-40">
            {funnelData.map((step, index) => (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">{formatNumber(step.value)}</span>
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
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-body text-xs font-semibold text-[var(--color-ink)]">Performance Over Time</h3>
                <p className="text-xs text-text-muted">Open rate & CTR trends</p>
              </div>
              <div className="flex gap-4 border-b border-[var(--color-border)]">
                {(["7d", "30d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn("border-b-2 px-0 py-1 font-body text-xs transition-colors duration-150", timeRange === range ? "border-[var(--color-ink)] font-medium text-[var(--color-ink)]" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]")}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E0DDD6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} interval={timeRange === "7d" ? 0 : 4} />
                  <YAxis tick={{ fontSize: 10, fill: "#9B9890", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="openRate" name="Open Rate" stroke="#111110" strokeWidth={1.5} dot={false} animationDuration={1000} animationBegin={700} />
                  <Line type="monotone" dataKey="ctr" name="CTR" stroke="#F5A623" strokeWidth={1.5} dot={false} animationDuration={1000} animationBegin={700} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Channel Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Channel Comparison</h3>
            <p className="text-xs text-text-muted mb-5">Engagement rates by channel</p>
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
          </motion.div>
        </div>

        {/* Bottom Grid: Channel Mix + Engagement Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Mix Donut */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Channel Mix</h3>
            <p className="text-xs text-text-muted mb-4">Distribution of campaigns sent</p>
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {channelMixData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{formatNumber(48200)}</p>
                  <p className="text-[10px] text-text-muted">Total Sent</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {channelMixData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                  <span className="text-text-muted">{item.name}</span>
                  <span className="text-text-primary font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Engagement Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 rounded-[2px] border border-[var(--color-border)] bg-white p-6 transition-colors duration-150 hover:border-[#BFBCB4]"
          >
            <h3 className="mb-1 font-body text-xs font-semibold text-[var(--color-ink)]">Channel Performance Detail</h3>
            <p className="text-xs text-text-muted mb-4">Detailed metrics by channel</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {["Channel", "Sent", "Delivered", "Opened", "Clicked", "Converted"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channelMetrics.map((m) => (
                    <tr key={m.channel} className="border-b border-[#F5F2EC] transition-colors duration-150 hover:bg-[var(--color-bg)]">
                      <td className="px-3 py-3 font-medium text-text-primary">{m.channel}</td>
                      <td className="px-3 py-3 text-text-muted">{formatNumber(m.sent)}</td>
                      <td className="px-3 py-3 text-text-muted">{formatNumber(m.delivered)}</td>
                      <td className="px-3 py-3 text-text-muted">{formatNumber(m.opened)}</td>
                      <td className="px-3 py-3 text-text-muted">{formatNumber(m.clicked)}</td>
                      <td className="px-3 py-3 text-text-primary font-medium">{formatNumber(m.converted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
