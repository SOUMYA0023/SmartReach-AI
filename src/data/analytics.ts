import { KpiMetric, FunnelStep, TimeSeriesPoint, ChannelMetric } from "@/types";

export const dashboardKpis: KpiMetric[] = [
  { label: "Total Customers", value: 12847, change: 12.3, changeLabel: "vs last month", format: "number", icon: "Users" },
  { label: "Active Segments", value: 7, change: 0, changeLabel: "segments tracked", format: "number", icon: "Target" },
  { label: "Campaigns Sent", value: 34, change: 18.5, changeLabel: "vs last month", format: "number", icon: "Send" },
  { label: "Avg Open Rate", value: 54.7, change: 8.2, changeLabel: "vs last month", format: "percentage", icon: "Eye" },
  { label: "Avg CTR", value: 18.9, change: -2.1, changeLabel: "vs last month", format: "percentage", icon: "MousePointerClick" },
  { label: "Revenue Influenced", value: 2450000, change: 23.7, changeLabel: "vs last month", format: "currency", icon: "IndianRupee" },
];

export const funnelData: FunnelStep[] = [
  { label: "Sent", value: 48200, percentage: 100, color: "#F5A623" },
  { label: "Delivered", value: 46100, percentage: 95.6, color: "#D99518" },
  { label: "Opened", value: 26400, percentage: 57.3, color: "#BFBCB4" },
  { label: "Clicked", value: 8700, percentage: 18.1, color: "#8F8B82" },
  { label: "Converted", value: 3200, percentage: 6.6, color: "#111110" },
];

export const timeSeriesData: TimeSeriesPoint[] = [
  { date: "May 13", openRate: 48.2, ctr: 16.1, conversions: 120 },
  { date: "May 14", openRate: 51.3, ctr: 17.8, conversions: 145 },
  { date: "May 15", openRate: 55.1, ctr: 19.2, conversions: 168 },
  { date: "May 16", openRate: 52.7, ctr: 18.5, conversions: 152 },
  { date: "May 17", openRate: 49.8, ctr: 16.9, conversions: 134 },
  { date: "May 18", openRate: 46.5, ctr: 15.2, conversions: 118 },
  { date: "May 19", openRate: 44.2, ctr: 14.8, conversions: 110 },
  { date: "May 20", openRate: 53.6, ctr: 18.1, conversions: 156 },
  { date: "May 21", openRate: 56.8, ctr: 20.3, conversions: 178 },
  { date: "May 22", openRate: 58.2, ctr: 21.1, conversions: 189 },
  { date: "May 23", openRate: 54.9, ctr: 19.7, conversions: 165 },
  { date: "May 24", openRate: 52.1, ctr: 18.3, conversions: 148 },
  { date: "May 25", openRate: 47.3, ctr: 15.6, conversions: 122 },
  { date: "May 26", openRate: 45.8, ctr: 14.9, conversions: 115 },
  { date: "May 27", openRate: 50.4, ctr: 17.2, conversions: 140 },
  { date: "May 28", openRate: 57.1, ctr: 20.8, conversions: 182 },
  { date: "May 29", openRate: 59.3, ctr: 22.4, conversions: 196 },
  { date: "May 30", openRate: 61.2, ctr: 23.1, conversions: 210 },
  { date: "May 31", openRate: 58.7, ctr: 21.6, conversions: 188 },
  { date: "Jun 01", openRate: 55.4, ctr: 19.8, conversions: 170 },
  { date: "Jun 02", openRate: 52.8, ctr: 18.2, conversions: 155 },
  { date: "Jun 03", openRate: 48.9, ctr: 16.5, conversions: 132 },
  { date: "Jun 04", openRate: 54.1, ctr: 19.4, conversions: 162 },
  { date: "Jun 05", openRate: 57.6, ctr: 21.2, conversions: 185 },
  { date: "Jun 06", openRate: 60.8, ctr: 23.5, conversions: 205 },
  { date: "Jun 07", openRate: 62.4, ctr: 24.1, conversions: 218 },
  { date: "Jun 08", openRate: 59.1, ctr: 22.3, conversions: 192 },
  { date: "Jun 09", openRate: 56.3, ctr: 20.7, conversions: 175 },
  { date: "Jun 10", openRate: 53.5, ctr: 19.1, conversions: 158 },
  { date: "Jun 11", openRate: 58.9, ctr: 21.8, conversions: 195 },
];

export const channelMetrics: ChannelMetric[] = [
  { channel: "WhatsApp", sent: 14200, delivered: 13800, opened: 9660, clicked: 3720, converted: 1380 },
  { channel: "Email", sent: 22400, delivered: 21800, opened: 10900, clicked: 3270, converted: 1090 },
  { channel: "SMS", sent: 8600, delivered: 8400, opened: 7560, clicked: 1260, converted: 504 },
  { channel: "Push", sent: 3000, delivered: 2900, opened: 1450, clicked: 435, converted: 145 },
];

export const channelMixData = [
  { name: "WhatsApp", value: 35, fill: "#2F855A" },
  { name: "Email", value: 38, fill: "#111110" },
  { name: "SMS", value: 18, fill: "#6B6860" },
  { name: "Push", value: 9, fill: "#F5A623" },
];

export const revenueData = {
  totalRevenue: 2450000,
  revenueGrowth: 23.7,
  avgOrderValue: 2340,
  aovChange: 5.2,
  topSegmentRevenue: { segment: "Champions", revenue: 1120000 },
  topChannelRevenue: { channel: "WhatsApp", revenue: 890000 },
};
