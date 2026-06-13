"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber, formatPercentage, formatDate } from "@/lib/utils";
import {
  Search, Mail, MessageSquare, Phone, Bell, Filter,
  ChevronRight, Calendar, Users, BarChart3, Eye, MousePointerClick,
  TrendingUp, Clock, CheckCircle2, XCircle, Loader2, Rocket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiCampaign } from "@/lib/api";

const channelIcons: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: Phone,
  rcs: Bell,
  Email: Mail,
  WhatsApp: MessageSquare,
  SMS: Phone,
  Push: Bell,
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  DRAFT: { color: "bg-[#F1EFE8] text-[var(--color-muted)]", icon: Clock },
  SCHEDULED: { color: "bg-[#F1EFE8] text-[var(--color-muted)]", icon: Calendar },
  LAUNCHING: { color: "bg-[#EAF3DE] text-[#3B6D11]", icon: Loader2 },
  ACTIVE: { color: "bg-[#EAF3DE] text-[#3B6D11]", icon: CheckCircle2 },
  DELIVERED: { color: "bg-[#EAF3DE] text-[#3B6D11]", icon: CheckCircle2 },
  FAILED: { color: "bg-[#FFECEC] text-[var(--color-negative)]", icon: XCircle },
  COMPLETED: { color: "bg-[var(--color-signal-dim)] text-[#7A5200]", icon: CheckCircle2 },
};

const statusTabs = ["All", "DRAFT", "ACTIVE", "DELIVERED", "COMPLETED", "FAILED"] as const;

function CampaignDetail({
  campaign,
  open,
  onClose,
}: {
  campaign: ApiCampaign | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: analytics } = useQuery({
    queryKey: ["campaign-analytics", campaign?.id],
    queryFn: () => api.getCampaignAnalytics(campaign!.id),
    enabled: !!campaign?.id && open,
  });

  if (!campaign) return null;
  const statusKey = campaign.status?.toUpperCase() ?? "DRAFT";
  const StatusIcon = statusConfig[statusKey]?.icon ?? Clock;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] bg-surface border-l border-border-subtle p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-text-primary text-base">{campaign.name}</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Status + Channel */}
          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs px-2.5 py-1 border-0", statusConfig[statusKey]?.color)}>
              <StatusIcon className="w-3 h-3 mr-1 inline" />
              {campaign.status}
            </Badge>
            <Badge className="bg-surface-elevated text-text-muted text-xs border-0">
              {campaign.channel}
            </Badge>
          </div>

          {/* Goal */}
          <div className="p-3 rounded-[2px] bg-surface border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Campaign Goal</span>
            </div>
            <p className="text-sm text-text-primary">{campaign.goal}</p>
          </div>

          {/* Live Analytics */}
          {analytics && analytics.sent > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sent", value: formatNumber(analytics.sent), icon: Rocket },
                { label: "Delivered", value: formatNumber(analytics.delivered), icon: CheckCircle2 },
                { label: "Open Rate", value: formatPercentage(analytics.open_rate), icon: Eye },
                { label: "CTR", value: formatPercentage(analytics.ctr), icon: MousePointerClick },
                { label: "Conversion Rate", value: formatPercentage(analytics.conversion_rate), icon: TrendingUp },
                { label: "Converted", value: formatNumber(analytics.converted), icon: BarChart3 },
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

          {/* Predicted metrics when no live data */}
          {(!analytics || analytics.sent === 0) && campaign.predicted_open_rate != null && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Predicted Open Rate", value: formatPercentage(campaign.predicted_open_rate ?? 0), icon: Eye },
                { label: "Predicted CTR", value: formatPercentage(campaign.predicted_ctr ?? 0), icon: MousePointerClick },
                { label: "Predicted Conv.", value: formatPercentage(campaign.predicted_conversion ?? 0), icon: TrendingUp },
                { label: "Est. Revenue", value: formatCurrency(campaign.predicted_revenue ?? 0), icon: BarChart3 },
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

          {/* Message Preview */}
          {campaign.message && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Message</h4>
              <div className="p-4 rounded-[2px] bg-surface-elevated border border-border-subtle">
                <p className="text-sm text-text-primary leading-relaxed">{campaign.message}</p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-text-muted">
            Created {formatDate(campaign.created_at)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<(typeof statusTabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<ApiCampaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.getCampaigns({ limit: 200 }),
    refetchInterval: 30_000,
  });

  const allCampaigns = data?.items ?? [];

  const filtered = useMemo(() => {
    return allCampaigns
      .filter((c) => {
        const statusKey = c.status?.toUpperCase() ?? "DRAFT";
        const matchesTab = activeTab === "All" || statusKey === activeTab;
        const matchesSearch =
          search === "" ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.goal?.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeTab, search, allCampaigns]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Campaigns"
        subtitle={
          isLoading
            ? "Loading campaigns…"
            : isError
            ? "Could not reach backend"
            : `${data?.total ?? 0} campaigns total`
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <div className="flex overflow-x-auto border-b border-[var(--color-border)]">
            {statusTabs.map((tab) => {
              const count =
                tab === "All"
                  ? allCampaigns.length
                  : allCampaigns.filter((c) => c.status?.toUpperCase() === tab).length;
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
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-[2px] border border-[var(--color-border)] bg-white"
              />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((campaign, index) => {
                const channelKey = campaign.channel?.toLowerCase() ?? "email";
                const ChannelIcon = channelIcons[campaign.channel] || channelIcons[channelKey] || Mail;
                const statusKey = campaign.status?.toUpperCase() ?? "DRAFT";
                const config = statusConfig[statusKey] ?? statusConfig.DRAFT;
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-[var(--color-border)]">
                      <ChannelIcon className="h-4 w-4 text-[var(--color-muted)]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                        {campaign.name}
                      </p>
                      <p className="mt-0.5 truncate font-body text-[11px] text-[var(--color-muted)]">
                        {campaign.goal}
                      </p>
                    </div>

                    <Badge className={cn("shrink-0 rounded-[2px] border-0 px-2 py-0.5 font-mono text-[9px] uppercase", config.color)}>
                      <StatusIcon className={cn("w-3 h-3 mr-1 inline", statusKey === "LAUNCHING" && "animate-spin")} />
                      {campaign.status}
                    </Badge>

                    {campaign.predicted_open_rate != null && (
                      <div className="hidden lg:flex items-center gap-4 text-xs text-text-muted">
                        <div className="text-center">
                          <p className="font-semibold text-text-primary">{campaign.predicted_open_rate.toFixed(1)}%</p>
                          <p>Open</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-text-primary">{(campaign.predicted_ctr ?? 0).toFixed(1)}%</p>
                          <p>CTR</p>
                        </div>
                        {(campaign.predicted_revenue ?? 0) > 0 && (
                          <div className="text-center">
                            <p className="font-semibold text-success">{formatCurrency(campaign.predicted_revenue ?? 0)}</p>
                            <p>Revenue</p>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="hidden shrink-0 font-mono text-[11px] text-[var(--color-muted)] sm:block">
                      {formatDate(campaign.created_at)}
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0 text-[#B4B2A9] transition-colors" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted text-sm">
                {allCampaigns.length === 0
                  ? "No campaigns yet — generate your first campaign in the AI Workspace"
                  : "No campaigns match your filters"}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <CampaignDetail campaign={selectedCampaign} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
