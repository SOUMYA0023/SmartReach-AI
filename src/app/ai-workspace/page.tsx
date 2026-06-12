"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn, formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import {
  Sparkles, Send, Target, MessageSquare, BarChart3, Rocket,
  Brain, Search as SearchIcon, Users, Radio, FileText, TrendingUp,
  CheckCircle2, Loader2, Clock, BookOpen, Shield, XCircle,
  ChevronRight, Zap, Activity, Database, Eye,
} from "lucide-react";
import { knowledgeSnippets } from "@/data/knowledge";
import type { AiStepStatus, Channel, ConfidenceScore, AgentTrace } from "@/types";

// ─── Types ───
interface AiStep {
  id: string;
  label: string;
  description: string;
  status: AiStepStatus;
  icon: React.ElementType;
  duration: number;
}

interface TimelineStep {
  title: string;
  value: string;
  detail?: string;
  icon: React.ElementType;
}

type WorkspacePhase = "idle" | "thinking" | "complete";

// ─── Suggestions ───
const suggestions = [
  "Bring back dormant coffee buyers",
  "Increase repeat purchases from high-value customers",
  "Launch a weekend offer for beauty shoppers",
  "Re-engage at-risk customers before churn",
  "Send first-purchase nudge to new sign-ups",
];

// ─── Mock AI Result Builder ───
function buildMockResult(goal: string) {
  const isDormant = goal.toLowerCase().includes("dormant") || goal.toLowerCase().includes("back");
  const isBeauty = goal.toLowerCase().includes("beauty") || goal.toLowerCase().includes("skincare");
  const isHighValue = goal.toLowerCase().includes("high-value") || goal.toLowerCase().includes("loyal") || goal.toLowerCase().includes("repeat");

  const channel: Channel = isDormant ? "WhatsApp" : isBeauty ? "Email" : isHighValue ? "WhatsApp" : "Email";
  const audienceSize = isDormant ? 1840 : isBeauty ? 3200 : isHighValue ? 890 : 2500;

  return {
    goal,
    channel,
    channelReasoning: channel === "WhatsApp"
      ? "WhatsApp outperforms email by 3.2x in CTR for this audience segment. High-intent engagement requires a direct, personal channel."
      : "Email is optimal for content-rich campaigns with product showcases. The Beauty segment prefers visual, detailed communications.",
    audienceSize,
    audienceLabel: isDormant ? "Dormant Customers (30-90 days)" : isBeauty ? "Beauty Shoppers (F, 18-35)" : isHighValue ? "Champions & Loyal" : "Target Audience",
    segmentBreakdown: isDormant
      ? [{ segment: "Dormant", pct: 62 }, { segment: "At Risk", pct: 28 }, { segment: "Lost (recent)", pct: 10 }]
      : isHighValue
        ? [{ segment: "Champions", pct: 55 }, { segment: "Loyal", pct: 35 }, { segment: "Potential Loyalist", pct: 10 }]
        : [{ segment: "Primary", pct: 60 }, { segment: "Secondary", pct: 30 }, { segment: "Adjacent", pct: 10 }],
    topCities: ["Mumbai", "Delhi", "Bangalore"],
    message: isDormant
      ? "Hey {{name}}! ☕ We miss you. Your favorite products are waiting — grab 20% off with code COMEBACK20. Only for 48 hours!"
      : isBeauty
        ? "✨ Weekend Beauty Sale is HERE, {{name}}! Up to 40% off premium skincare. Free shipping above ₹999. Shop now →"
        : isHighValue
          ? "Hi {{name}} 👑 You're one of our top customers! Enjoy exclusive early access + a ₹500 reward. Thank you for being amazing!"
          : "Hey {{name}}! We've got something special just for you. Check it out →",
    subject: isDormant ? "We miss you! Come back for 20% off" : isBeauty ? "Weekend Beauty Sale — Up to 40% off ✨" : "Exclusive Offer Just for You 👑",
    forecast: { deliveryRate: 97.2, openRate: isDormant ? 68.5 : isBeauty ? 42.1 : 78.2, ctr: isDormant ? 24.3 : isBeauty ? 15.8 : 32.1, conversions: Math.round(audienceSize * 0.087), revenue: isDormant ? 142000 : isBeauty ? 287000 : 198000 },
    confidenceScores: [
      { label: "Audience Confidence", score: 92, reasoning: "High match rate with historical segment performance data." },
      { label: "Channel Confidence", score: 88, reasoning: `${channel} shows consistently high engagement for this audience profile.` },
      { label: "Forecast Confidence", score: 81, reasoning: "Based on 12 similar campaigns with comparable audience composition." },
    ] as ConfidenceScore[],
    exclusions: [
      { audience: "Recent buyers (< 14 days)", reason: "May experience campaign fatigue. Allow cooldown period." },
      { audience: "Opted-out users", reason: "Regulatory compliance. Excluded from all channels." },
      { audience: "Active cart holders", reason: "Already in conversion funnel. Separate cart recovery flow active." },
    ],
    knowledgeUsed: knowledgeSnippets.filter((s) => s.usedByAi).slice(0, 3),
    agentTraces: [
      { id: "planner", name: "Planner Agent", status: "complete" as const, duration: 1.2, details: "Parsed goal, identified intent as win-back/engagement" },
      { id: "audience", name: "Audience Agent", status: "complete" as const, duration: 2.8, details: `Selected ${formatNumber(audienceSize)} customers across 3 segments` },
      { id: "channel", name: "Channel Agent", status: "complete" as const, duration: 1.5, details: `Evaluated 4 channels, selected ${channel}` },
      { id: "content", name: "Content Agent", status: "complete" as const, duration: 3.1, details: "Generated personalized campaign copy with dynamic fields" },
      { id: "analytics", name: "Analytics Agent", status: "complete" as const, duration: 2.2, details: "Forecasted delivery, engagement, and revenue metrics" },
    ] as AgentTrace[],
    timeline: [
      { title: "Goal Received", value: goal, icon: Target },
      { title: "Retrieved", value: isDormant ? "Win-back Playbook" : isBeauty ? "Channel Optimization Guide" : "Retention Framework", icon: BookOpen },
      { title: "Selected", value: isDormant ? "Dormant Customers" : isBeauty ? "Beauty Shoppers" : "Champions & Loyal", icon: Users },
      { title: "Recommended", value: channel, icon: Radio },
      { title: "Generated", value: isDormant ? "20% Discount Campaign" : isBeauty ? "Flash Sale Campaign" : "Loyalty Reward Campaign", icon: FileText },
      { title: "Forecast", value: formatCurrency(isDormant ? 142000 : isBeauty ? 287000 : 198000) + " Revenue", icon: TrendingUp },
    ] as TimelineStep[],
  };
}

// ─── Sub-components ───

function ConfidenceCard({ score }: { score: ConfidenceScore }) {
  const color = score.score >= 90 ? "text-success" : score.score >= 80 ? "text-[var(--color-signal)]" : "text-warning";
  const bg = score.score >= 90 ? "bg-success" : score.score >= 80 ? "bg-neon-purple" : "bg-warning";
  return (
    <div className="p-3 rounded-[2px] bg-surface border border-border-subtle">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{score.label}</span>
        <span className={cn("text-lg font-bold", color)}>{score.score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden mb-2">
        <motion.div className={cn("h-full rounded-full", bg)} initial={{ width: 0 }} animate={{ width: `${score.score}%` }} transition={{ duration: 1, ease: "easeOut" }} />
      </div>
      <p className="text-[10px] text-text-muted">{score.reasoning}</p>
    </div>
  );
}

function AgentTracePanel({ traces }: { traces: AgentTrace[] }) {
  return (
    <div className="rounded-[2px] bg-surface border border-border-subtle p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[var(--color-signal)]" />
        <h3 className="text-sm font-semibold text-text-primary">Agent Trace</h3>
      </div>
      <div className="space-y-2">
        {traces.map((trace, i) => (
          <motion.div
            key={trace.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-2.5 rounded-[2px] bg-surface-elevated/50"
          >
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary">{trace.name}</p>
              {trace.details && <p className="text-[10px] text-text-muted truncate">{trace.details}</p>}
            </div>
            <span className="text-[10px] text-text-muted flex-shrink-0">{trace.duration}s</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
        <span>Retrieved Documents: 4</span>
        <span>Reasoning Steps: 6</span>
      </div>
    </div>
  );
}

function DecisionTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="rounded-[2px] bg-surface border border-border-subtle p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-neon-purple" />
        <h3 className="text-sm font-semibold text-text-primary">AI Memory Timeline</h3>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neon-purple/30" />
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="relative mb-4 last:mb-0"
          >
            <div className="absolute -left-6 top-1 w-[22px] h-[22px] rounded-full bg-surface-elevated border-2 border-neon-purple flex items-center justify-center">
              <step.icon className="w-2.5 h-2.5 text-neon-purple" />
            </div>
            <div className="ml-3 p-2.5 rounded-[2px] bg-surface-elevated/50">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{step.title}</p>
              <p className="text-xs font-medium text-text-primary mt-0.5">{step.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function AiWorkspacePage() {
  const [phase, setPhase] = useState<WorkspacePhase>("idle");
  const [prompt, setPrompt] = useState("");
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [result, setResult] = useState<ReturnType<typeof buildMockResult> | null>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [showSystemMonitor, setShowSystemMonitor] = useState(false);

  const aiSteps: AiStep[] = [
    { id: "parse", label: "Understanding your goal", description: "Analyzing intent and business objective", icon: Brain, status: "pending", duration: 800 },
    { id: "retrieve", label: "Retrieving marketing playbooks", description: "Searching knowledge base for relevant strategies", icon: SearchIcon, status: "pending", duration: 1200 },
    { id: "audience", label: "Analyzing customer base", description: "Building target audience from segmentation data", icon: Users, status: "pending", duration: 1500 },
    { id: "channel", label: "Selecting best channel", description: "Evaluating channel performance for this audience", icon: Radio, status: "pending", duration: 1000 },
    { id: "draft", label: "Drafting campaign copy", description: "Generating personalized message with AI", icon: FileText, status: "pending", duration: 1400 },
    { id: "forecast", label: "Forecasting performance", description: "Predicting engagement and revenue metrics", icon: TrendingUp, status: "pending", duration: 1100 },
    { id: "ready", label: "Campaign ready to launch", description: "All preparations complete", icon: Rocket, status: "pending", duration: 600 },
  ];

  const getStepStatus = useCallback((index: number): AiStepStatus => {
    if (phase === "complete") return "complete";
    if (index < currentStepIdx) return "complete";
    if (index === currentStepIdx) return "active";
    return "pending";
  }, [phase, currentStepIdx]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || phase === "thinking") return;
    setPhase("thinking");
    setCurrentStepIdx(0);
    setLaunched(false);

    const mockResult = buildMockResult(prompt);
    let step = 0;

    const advance = () => {
      if (step < aiSteps.length - 1) {
        step++;
        setCurrentStepIdx(step);
        setTimeout(advance, aiSteps[step].duration);
      } else {
        setTimeout(() => {
          setResult(mockResult);
          setPhase("complete");
        }, 500);
      }
    };

    setTimeout(advance, aiSteps[0].duration);
  }, [prompt, phase]);

  const handleLaunch = () => {
    setShowLaunchModal(false);
    setLaunched(true);
  };

  const handleReset = () => {
    setPhase("idle");
    setPrompt("");
    setCurrentStepIdx(-1);
    setResult(null);
    setLaunched(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="AI Workspace" subtitle="AI-powered campaign strategist" />

      <div className="flex-1 overflow-y-auto p-8">
        {/* ─── IDLE STATE ─── */}
        {phase === "idle" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pt-12 space-y-8">
            <div className="text-center space-y-3">
              <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
                <div className="w-16 h-16 rounded-[2px] bg-neon-purple mx-auto flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-text-primary">What&apos;s your marketing goal?</h2>
              <p className="text-text-muted text-sm max-w-md mx-auto">
                Describe your business objective in natural language. The AI will analyze your data, retrieve knowledge, and build a launch-ready campaign.
              </p>
            </div>

            {/* Prompt Input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="e.g., Bring back dormant coffee buyers with a personalized offer..."
                rows={3}
                className="w-full px-5 py-4 rounded-[2px] bg-surface border border-border-subtle text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-text-primary/10 transition-all text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="absolute right-3 bottom-3 p-2.5 rounded-[2px] bg-neon-purple text-white disabled:opacity-30 hover:bg-[#6D28D9] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 rounded-[2px] bg-surface-elevated text-xs text-text-muted hover:text-text-primary hover:bg-neon-purple/10 transition-all border border-transparent hover:border-[#BFBCB4]"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── THINKING STATE ─── */}
        {phase === "thinking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto pt-8 space-y-6">
            <div className="text-center space-y-2 mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-8 h-8 text-neon-purple mx-auto" />
              </motion.div>
              <h3 className="text-lg font-semibold text-text-primary">AI is building your campaign</h3>
              <p className="text-xs text-text-muted">&ldquo;{prompt}&rdquo;</p>
            </div>

            <div className="space-y-3">
              {aiSteps.map((step, index) => {
                const status = getStepStatus(index);
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: status === "pending" ? 0.4 : 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={cn("flex items-center gap-4 p-4 rounded-[2px] transition-all", status === "active" ? "bg-neon-purple/10 border border-neon-purple/20" : status === "complete" ? "bg-surface-elevated/50 border border-border-subtle" : "bg-surface/30 border border-transparent")}
                  >
                    {status === "active" ? (
                      <Loader2 className="w-5 h-5 text-neon-purple animate-spin flex-shrink-0" />
                    ) : status === "complete" ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-text-muted/30 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", status === "pending" ? "text-text-muted/40" : "text-text-primary")}>{step.label}</p>
                      {status === "active" && <p className="text-xs text-neon-purple mt-0.5">{step.description}…</p>}
                    </div>
                    {status === "active" && <div className="ai-shimmer h-1 w-16 rounded-full" />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── COMPLETE STATE ─── */}
        {phase === "complete" && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Campaign Ready</h3>
                <p className="text-xs text-text-muted">&ldquo;{result.goal}&rdquo;</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSystemMonitor(true)} className="px-3 py-1.5 rounded-[2px] bg-surface-elevated text-xs text-text-muted hover:text-[var(--color-signal)] transition-colors border border-border-subtle">
                  <Activity className="w-3.5 h-3.5 inline mr-1.5" />System Monitor
                </button>
                <button onClick={handleReset} className="px-3 py-1.5 rounded-[2px] bg-surface-elevated text-xs text-text-muted hover:text-text-primary transition-colors border border-border-subtle">
                  New Goal
                </button>
                {!launched && (
                  <button onClick={() => setShowLaunchModal(true)} className="px-4 py-1.5 rounded-[2px] bg-neon-purple text-white text-xs font-semibold hover:bg-[#6D28D9] transition-colors">
                    <Rocket className="w-3.5 h-3.5 inline mr-1.5" />Launch Campaign
                  </button>
                )}
                {launched && (
                  <Badge className="bg-success/15 text-success text-xs px-3 py-1.5">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />Launched
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Grid: Left results + Right panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: Main results (2 cols) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Confidence Scores */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="grid grid-cols-3 gap-3">
                    {result.confidenceScores.map((s) => <ConfidenceCard key={s.label} score={s} />)}
                  </div>
                </motion.div>

                {/* Audience Summary */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-[2px] bg-surface border border-border-subtle p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-neon-purple" />
                    <h3 className="text-sm font-semibold text-text-primary">Audience Summary</h3>
                    <Badge className="bg-neon-purple/15 text-neon-purple text-[10px] ml-auto">{formatNumber(result.audienceSize)} customers</Badge>
                  </div>
                  <p className="text-xs text-text-muted mb-3">{result.audienceLabel}</p>
                  <div className="flex gap-2 mb-3">
                    {result.segmentBreakdown.map((s) => (
                      <div key={s.segment} className="flex-1 p-2.5 rounded-[2px] bg-surface-elevated">
                        <p className="text-[10px] text-text-muted">{s.segment}</p>
                        <p className="text-sm font-bold text-text-primary">{s.pct}%</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted">Top cities: {result.topCities.join(", ")}</p>
                </motion.div>

                {/* Why This Audience + Why NOT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-[2px] bg-surface border border-border-subtle p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-success" />
                      <h3 className="text-sm font-semibold text-text-primary">Why This Audience?</h3>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      This audience was selected based on RFM analysis, engagement history, and campaign response patterns. The segment shows the highest predicted responsiveness to {result.channel} campaigns.
                    </p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-[2px] bg-surface border border-border-subtle p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-warning" />
                      <h3 className="text-sm font-semibold text-text-primary">Why NOT Other Audiences?</h3>
                    </div>
                    <div className="space-y-2">
                      {result.exclusions.map((ex, i) => (
                        <div key={i} className="text-xs">
                          <p className="text-text-primary font-medium">Excluded: {ex.audience}</p>
                          <p className="text-text-muted">{ex.reason}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Channel & Message */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-[2px] bg-surface border border-border-subtle p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Radio className="w-4 h-4 text-[var(--color-signal)]" />
                    <h3 className="text-sm font-semibold text-text-primary">Recommended Channel: {result.channel}</h3>
                  </div>
                  <p className="text-xs text-text-muted mb-4">{result.channelReasoning}</p>
                  <div className="p-4 rounded-[2px] bg-surface-elevated border border-border-subtle">
                    {result.subject && (
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Subject: {result.subject}</p>
                    )}
                    <p className="text-sm text-text-primary leading-relaxed">{result.message}</p>
                  </div>
                </motion.div>

                {/* Forecast Simulator */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-[2px] bg-surface border border-neon-purple/15 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-neon-purple" />
                    <h3 className="text-sm font-semibold text-text-primary">Forecast Simulator</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: "Delivery Rate", value: formatPercentage(result.forecast.deliveryRate) },
                      { label: "Open Rate", value: formatPercentage(result.forecast.openRate) },
                      { label: "CTR", value: formatPercentage(result.forecast.ctr) },
                      { label: "Conversions", value: formatNumber(result.forecast.conversions) },
                      { label: "Est. Revenue", value: formatCurrency(result.forecast.revenue) },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-[2px] bg-surface-elevated text-center">
                        <p className="text-[10px] text-text-muted mb-1">{m.label}</p>
                        <p className="font-mono text-lg font-medium text-[var(--color-ink)]">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Knowledge / RAG Cards */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-[2px] bg-surface border border-border-subtle p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-[var(--color-signal)]" />
                    <h3 className="text-sm font-semibold text-text-primary">Retrieved Knowledge</h3>
                    <span className="text-[10px] text-text-muted ml-auto">From Marketing Intelligence Hub</span>
                  </div>
                  <div className="space-y-3">
                    {result.knowledgeUsed.map((snippet) => (
                      <div key={snippet.id} className="p-3 rounded-[2px] bg-surface-elevated border border-border-subtle">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="bg-neon-purple/10 text-neon-purple text-[9px]">{snippet.category}</Badge>
                          <span className="text-[10px] text-text-muted">{snippet.source}</span>
                        </div>
                        <p className="text-xs font-medium text-text-primary mb-1">{snippet.title}</p>
                        <p className="text-xs text-text-muted leading-relaxed">{snippet.content}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* RIGHT: Agent Trace + Timeline (1 col) */}
              <div className="space-y-5">
                <AgentTracePanel traces={result.agentTraces} />
                <DecisionTimeline steps={result.timeline} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Launch Confirmation Modal ─── */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="bg-surface border border-border-subtle max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <Rocket className="w-5 h-5 text-neon-purple" />
              Launch Campaign
            </DialogTitle>
            <DialogDescription className="text-text-muted text-xs">Review and confirm before launching</DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-[2px] bg-surface space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Audience</span><span className="text-text-primary font-medium">{formatNumber(result.audienceSize)} customers</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Channel</span><span className="text-text-primary font-medium">{result.channel}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Est. Revenue</span><span className="text-text-primary font-medium">{formatCurrency(result.forecast.revenue)}</span></div>
              </div>
              <div className="p-3 rounded-[2px] bg-surface-elevated text-xs text-text-primary">{result.message}</div>
              <div className="flex gap-2">
                <button onClick={() => setShowLaunchModal(false)} className="flex-1 px-4 py-2 rounded-[2px] bg-surface border border-border-subtle text-text-muted text-sm hover:text-text-primary transition-colors">Cancel</button>
                <button onClick={handleLaunch} className="flex-1 px-4 py-2 rounded-[2px] bg-neon-purple text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
                  <Rocket className="w-3.5 h-3.5 inline mr-1.5" />Approve & Launch
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── AI System Monitor Modal ─── */}
      <Dialog open={showSystemMonitor} onOpenChange={setShowSystemMonitor}>
        <DialogContent className="bg-surface border border-border-subtle max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--color-signal)]" />
              AI System Monitor
            </DialogTitle>
            <DialogDescription className="text-text-muted text-xs">Multi-agent system execution trace</DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-4 mt-2">
              {result.agentTraces.map((trace) => (
                <div key={trace.id} className="flex items-center gap-3 p-3 rounded-[2px] bg-surface border border-border-subtle">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{trace.name}</p>
                    <p className="text-[10px] text-text-muted">{trace.details}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-success/15 text-success text-[10px]">Complete</Badge>
                    <p className="text-[10px] text-text-muted mt-1">{trace.duration}s</p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-[2px] bg-surface-elevated text-center">
                  <Database className="w-4 h-4 text-neon-purple mx-auto mb-1" />
                  <p className="text-lg font-bold text-text-primary">4</p>
                  <p className="text-[10px] text-text-muted">Documents</p>
                </div>
                <div className="p-3 rounded-[2px] bg-surface-elevated text-center">
                  <Brain className="w-4 h-4 text-[var(--color-signal)] mx-auto mb-1" />
                  <p className="text-lg font-bold text-text-primary">91%</p>
                  <p className="text-[10px] text-text-muted">Knowledge Confidence</p>
                </div>
                <div className="p-3 rounded-[2px] bg-surface-elevated text-center">
                  <Eye className="w-4 h-4 text-success mx-auto mb-1" />
                  <p className="text-lg font-bold text-text-primary">6</p>
                  <p className="text-[10px] text-text-muted">Reasoning Steps</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
