"use client";

import { motion } from "framer-motion";
import { campaigns } from "@/data/campaigns";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Mail, MessageSquare, Phone, Bell } from "lucide-react";

const channelIcons: Record<string, React.ElementType> = {
  Email: Mail,
  WhatsApp: MessageSquare,
  SMS: Phone,
  Push: Bell,
};

const statusColors: Record<string, string> = {
  Draft: "bg-[#F1EFE8] text-[var(--color-muted)]",
  Scheduled: "bg-[#F1EFE8] text-[var(--color-muted)]",
  Running: "bg-[#EAF3DE] text-[#3B6D11]",
  Active: "bg-[#EAF3DE] text-[#3B6D11]",
  Delivered: "bg-[#EAF3DE] text-[#3B6D11]",
  Failed: "bg-[#FFECEC] text-[var(--color-negative)]",
  Completed: "bg-[var(--color-signal-dim)] text-[#7A5200]",
};

export function RecentCampaigns() {
  const recentCampaigns = campaigns
    .filter((c) => c.status !== "Draft")
    .slice(0, 5);

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
        Latest campaign activity
      </p>

      <div>
        <div className="grid grid-cols-[1fr_96px_96px_80px] border-b border-[var(--color-border)] pb-2 font-body text-[9px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
          <span>Campaign Name</span>
          <span>Status</span>
          <span className="text-right">Open Rate</span>
          <span className="text-right">Sent</span>
        </div>
        {recentCampaigns.map((campaign, index) => {
          const ChannelIcon = channelIcons[campaign.channel] || Mail;

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
                    {formatRelativeDate(campaign.createdAt)} · {campaign.channel}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "w-fit rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] uppercase",
                  statusColors[campaign.status]
                )}
              >
                {campaign.status}
              </span>

              <span className="text-right font-mono text-[11px] text-[var(--color-ink)] tabular-nums">
                {campaign.openRate > 0 ? `${campaign.openRate}%` : "—"}
              </span>
              <span className="text-right font-mono text-[11px] text-[var(--color-muted)] tabular-nums">
                {campaign.sentCount > 0 ? campaign.sentCount.toLocaleString() : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
