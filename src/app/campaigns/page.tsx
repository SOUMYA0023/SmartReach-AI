"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { campaigns } from "@/data/campaigns";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber, formatPercentage, formatDate } from "@/lib/utils";
import {
  Search, Mail, MessageSquare, Phone, Bell, Filter,
  ChevronRight, Calendar, Users, BarChart3, Eye, MousePointerClick,
  TrendingUp, Clock, CheckCircle2, XCircle, Loader2, Rocket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Campaign, CampaignStatus } from "@/types";

const channelIcons: Record<string, React.ElementType> = {
  Email: Mail,
  WhatsApp: MessageSquare,
  SMS: Phone,
  Push: Bell,
};

const statusConfig: Record<CampaignStatus, { color: string; icon: React.ElementType }> = {
  Draft: { color: "bg-[#F1EFE8] text-[var(--color-muted)]", icon: Clock },
  Scheduled: { color: "bg-[#F1EFE8] text-[var(--color-muted)]", icon: Calendar },
  Running: { color: "bg-[#EAF3DE] text-[#3B6D11]", icon: Loader2 },
  Delivered: { color: "bg-[#EAF3DE] text-[#3B6D11]", icon: CheckCircle2 },
  Failed: { color: "bg-[#FFECEC] text-[var(--color-negative)]", icon: XCircle },
  Completed: { color: "bg-[var(--color-signal-dim)] text-[#7A5200]", icon: CheckCircle2 },
};

const statusTabs: (CampaignStatus | "All")[] = [
  "All", "Draft", "Scheduled", "Running", "Delivered", "Completed", "Failed",
];

function CampaignDetail({ campaign, open, onClose }: { campaign: Campaign | null; open: boolean; onClose: () => void }) {
  if (!campaign) return null;
  const StatusIcon = statusConfig[campaign.status].icon;

  const timelineEvents = [
    { label: "Created", date: campaign.createdAt, done: true },
    ...(campaign.scheduledAt ? [{ label: "Scheduled", date: campaign.scheduledAt.split("T")[0], done: true }] : []),
    { label: "Sent", date: campaign.sentCount > 0 ? campaign.createdAt : "", done: campaign.sentCount > 0 },
    { label: "Delivered", date: campaign.deliveredCount > 0 ? campaign.createdAt : "", done: campaign.deliveredCount > 0 },
    { label: "Completed", date: campaign.status === "Completed" ? campaign.createdAt : "", done: campaign.status === "Completed" },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] bg-surface border-l border-border-subtle p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-text-primary text-base">{campaign.name}</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Status + Channel */}
          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs px-2.5 py-1 border-0", statusConfig[campaign.status].color)}>
              <StatusIcon className="w-3 h-3 mr-1 inline" />
              {campaign.status}
            </Badge>
            <Badge className="bg-surface-elevated text-text-muted text-xs border-0">
              {campaign.channel}
            </Badge>
          </div>

          {/* Target Audience */}
          <div className="p-3 rounded-[2px] bg-surface border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Target Audience</span>
            </div>
            <p className="text-sm text-text-primary">{campaign.targetAudience}</p>
          </div>

          {/* Metrics Grid */}
          {campaign.sentCount > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sent", value: formatNumber(campaign.sentCount), icon: Rocket },
                { label: "Delivered", value: formatNumber(campaign.deliveredCount), icon: CheckCircle2 },
                { label: "Open Rate", value: formatPercentage(campaign.openRate), icon: Eye },
                { label: "CTR", value: formatPercentage(campaign.ctr), icon: MousePointerClick },
                { label: "Conversion Rate", value: formatPercentage(campaign.conversionRate), icon: TrendingUp },
                { label: "Revenue", value: formatCurrency(campaign.revenue), icon: BarChart3 },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-[2px] bg-surface border border-border-subtle">
                  <div className="flex items-center gap-1.5 mb-1">
                    <m.icon className="w-3 h-3 text-text-muted" />
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Funnel */}
          {campaign.sentCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Campaign Funnel</h4>
              {[
                { label: "Sent", value: campaign.sentCount, pct: 100, color: "#111110" },
                { label: "Delivered", value: campaign.deliveredCount, pct: (campaign.deliveredCount / campaign.sentCount) * 100, color: "#3A3A38" },
                { label: "Opened", value: Math.round(campaign.deliveredCount * campaign.openRate / 100), pct: campaign.openRate, color: "#888780" },
                { label: "Clicked", value: Math.round(campaign.deliveredCount * campaign.ctr / 100), pct: campaign.ctr, color: "#B4B2A9" },
                { label: "Converted", value: Math.round(campaign.deliveredCount * campaign.conversionRate / 100), pct: campaign.conversionRate, color: "#F5A623" },
              ].map((step) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{step.label}</span>
                    <span className="text-text-primary font-medium">{formatNumber(step.value)}</span>
                  </div>
                  <div className="h-[3px] overflow-hidden bg-[#F0EDE8]">
                    <motion.div
                      className="h-full"
                      style={{ background: step.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${step.pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Preview */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Message</h4>
            <div className="p-4 rounded-[2px] bg-surface-elevated border border-border-subtle">
              <p className="text-sm text-text-primary leading-relaxed">{campaign.message}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Timeline</h4>
            <div className="relative pl-6 space-y-3">
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border-subtle" />
              {timelineEvents.map((event, i) => (
                <div key={i} className="relative flex items-center gap-3">
                  <div className={cn("absolute -left-6 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center", event.done ? "bg-surface-elevated border-success" : "bg-surface border-border-subtle")}>
                    {event.done && <CheckCircle2 className="w-2.5 h-2.5 text-success" />}
                  </div>
                  <div className="ml-2">
                    <p className={cn("text-xs font-medium", event.done ? "text-text-primary" : "text-text-muted/50")}>{event.label}</p>
                    {event.date && <p className="text-[10px] text-text-muted">{formatDate(event.date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<CampaignStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    return campaigns
      .filter((c) => {
        const matchesTab = activeTab === "All" || c.status === activeTab;
        const matchesSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeTab, search]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Campaigns" subtitle="Campaign lifecycle management" />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* Status Tabs */}
          <div className="flex overflow-x-auto border-b border-[var(--color-border)]">
            {statusTabs.map((tab) => {
              const count = tab === "All" ? campaigns.length : campaigns.filter((c) => c.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-4 py-2 font-body text-xs transition-colors duration-150",
                    activeTab === tab
                      ? "border-[var(--color-ink)] font-medium text-[var(--color-ink)]"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border-subtle text-text-primary placeholder:text-text-muted focus:border-text-primary text-sm"
            />
          </div>
        </motion.div>

        {/* Campaign Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((campaign, index) => {
              const ChannelIcon = channelIcons[campaign.channel] || Mail;
              const config = statusConfig[campaign.status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={campaign.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03 } }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={() => { setSelectedCampaign(campaign); setDetailOpen(true); }}
                  className="group mb-2 flex cursor-pointer items-center gap-4 rounded-[2px] border border-[var(--color-border)] bg-white px-5 py-4 transition-colors duration-150 hover:border-[#BFBCB4]"
                >
                  {/* Channel Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-[var(--color-border)]">
                    <ChannelIcon className="h-4 w-4 text-[var(--color-muted)]" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                      {campaign.name}
                    </p>
                    <p className="mt-0.5 truncate font-body text-[11px] text-[var(--color-muted)]">
                      {campaign.targetAudience}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge className={cn("shrink-0 rounded-[2px] border-0 px-2 py-0.5 font-mono text-[9px] uppercase", config.color)}>
                    <StatusIcon className={cn("w-3 h-3 mr-1 inline", campaign.status === "Running" && "animate-spin")} />
                    {campaign.status}
                  </Badge>

                  {/* Metrics (desktop only) */}
                  {campaign.sentCount > 0 && (
                    <div className="hidden lg:flex items-center gap-4 text-xs text-text-muted">
                      <div className="text-center">
                        <p className="font-semibold text-text-primary">{formatNumber(campaign.sentCount)}</p>
                        <p>Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-text-primary">{campaign.openRate}%</p>
                        <p>Open</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-text-primary">{campaign.ctr}%</p>
                        <p>CTR</p>
                      </div>
                      {campaign.revenue > 0 && (
                        <div className="text-center">
                          <p className="font-semibold text-success">{formatCurrency(campaign.revenue)}</p>
                          <p>Revenue</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <span className="hidden shrink-0 font-mono text-[11px] text-[var(--color-muted)] sm:block">
                    {formatDate(campaign.createdAt)}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-[#B4B2A9] transition-colors" />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted text-sm">No campaigns found</p>
            </div>
          )}
        </motion.div>
      </div>

      <CampaignDetail campaign={selectedCampaign} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
