"use client";

import { motion } from "framer-motion";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Mail, MessageSquare, Phone, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

const statusColors: Record<string, string> = {
  DRAFT: "bg-[#F1EFE8] text-[var(--color-muted)]",
  SCHEDULED: "bg-[#F1EFE8] text-[var(--color-muted)]",
  LAUNCHING: "bg-[#EAF3DE] text-[#3B6D11]",
  ACTIVE: "bg-[#EAF3DE] text-[#3B6D11]",
  DELIVERED: "bg-[#EAF3DE] text-[#3B6D11]",
  FAILED: "bg-[#FFECEC] text-[var(--color-negative)]",
  COMPLETED: "bg-[var(--color-signal-dim)] text-[#7A5200]",
};

export function RecentCampaigns() {
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", { limit: 5 }],
    queryFn: () => api.getCampaigns({ limit: 5 }),
    refetchInterval: 30_000,
  });

  const recentCampaigns = data?.items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
      className="rounded-[2px] border border-[var(--color-border)] bg-white px-[18px] py-4 transition-colors duration-150 hover:border-[#BFBCB4]"
    >
      <h3 className="font-body text-xs font-semibold text-[var(--color-ink)]">
        Recent Campaigns
      </h3>
      <p className="mb-3.5 font-body text-[10px] text-[var(--color-muted)]">
        Latest campaign activity · {data?.total ?? "—"} total
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-[2px] bg-[#F5F2EC]" />
          ))}
        </div>
      ) : recentCampaigns.length === 0 ? (
        <p className="py-6 text-center font-body text-xs text-[var(--color-muted)]">
          No campaigns yet — generate one in AI Workspace
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_96px_96px_80px] border-b border-[var(--color-border)] pb-2 font-body text-[9px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
            <span>Campaign Name</span>
            <span>Status</span>
            <span className="text-right">Open Rate</span>
            <span className="text-right">Channel</span>
          </div>
          {recentCampaigns.map((campaign, index) => {
            const channelKey = campaign.channel?.toLowerCase() ?? "email";
            const ChannelIcon = channelIcons[campaign.channel] || channelIcons[channelKey] || Mail;
            const statusColor = statusColors[campaign.status?.toUpperCase()] ?? statusColors.DRAFT;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.05, duration: 0.2 }}
                className="grid grid-cols-[1fr_96px_96px_80px] items-center border-b border-[#F5F2EC] py-2 transition-colors duration-150 last:border-b-0 hover:bg-[var(--color-bg)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <ChannelIcon className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate font-body text-xs font-medium text-[#111110]">
                      {campaign.name}
                    </p>
                    <p className="mt-0.5 block font-body text-[10px] text-[#9B9890]">
                      {formatRelativeDate(campaign.created_at)} · {campaign.segment ?? "All"}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "w-fit rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] uppercase",
                    statusColor
                  )}
                >
                  {campaign.status}
                </span>

                <span className="text-right font-mono text-[11px] text-[var(--color-ink)] tabular-nums">
                  {campaign.predicted_open_rate != null
                    ? `${campaign.predicted_open_rate.toFixed(1)}%`
                    : "—"}
                </span>
                <span className="text-right font-mono text-[11px] text-[var(--color-muted)] tabular-nums uppercase">
                  {campaign.channel ?? "—"}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
