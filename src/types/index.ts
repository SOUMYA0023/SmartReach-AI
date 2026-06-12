// ─── Customer & Order Types ───
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: number;
  totalOrders: number;
  lastOrderDate: string;
  segment: CustomerSegment;
  engagementScore: number;
  preferredChannel: Channel;
  rfmLabel: RfmLabel;
  avatarUrl?: string;
  joinDate: string;
}

export interface Order {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  items: string[];
  status: "completed" | "refunded" | "pending";
}

export type CustomerSegment =
  | "Champions"
  | "Loyal"
  | "Potential Loyalist"
  | "New Customers"
  | "At Risk"
  | "Dormant"
  | "Lost";

export type RfmLabel = "High" | "Medium" | "Low";
export type Channel = "Email" | "SMS" | "WhatsApp" | "Push";
export type SpendTier = "Premium" | "Mid-Tier" | "Budget";

// ─── Campaign Types ───
export type CampaignStatus =
  | "Draft"
  | "Scheduled"
  | "Running"
  | "Delivered"
  | "Failed"
  | "Completed";

export interface Campaign {
  id: string;
  name: string;
  targetAudience: string;
  channel: Channel;
  status: CampaignStatus;
  createdAt: string;
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  openRate: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  message: string;
}

// ─── Analytics Types ───
export interface KpiMetric {
  label: string;
  value: number;
  change: number;
  changeLabel: string;
  format: "number" | "currency" | "percentage";
  icon: string;
}

export interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TimeSeriesPoint {
  date: string;
  openRate: number;
  ctr: number;
  conversions: number;
}

export interface ChannelMetric {
  channel: Channel;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

// ─── AI Workspace Types ───
export type AiStepStatus = "pending" | "active" | "complete" | "error";

export interface AiStep {
  id: string;
  label: string;
  description: string;
  status: AiStepStatus;
  icon: string;
  duration?: number;
}

export interface AgentTrace {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "error";
  duration: number;
  details?: string;
}

export interface ConfidenceScore {
  label: string;
  score: number;
  reasoning: string;
}

export interface KnowledgeSnippet {
  id: string;
  title: string;
  content: string;
  source: string;
  category: "Win-back" | "Retention" | "Acquisition" | "Channel Strategy" | "Segmentation" | "Personalization";
  relevanceScore: number;
  usedByAi: boolean;
}

export interface AudienceSummary {
  totalSize: number;
  segmentBreakdown: { segment: string; count: number; percentage: number }[];
  topCities: { city: string; count: number }[];
  avgSpend: number;
  avgEngagement: number;
}

export interface CampaignForecast {
  estimatedDeliveryRate: number;
  estimatedOpenRate: number;
  estimatedCtr: number;
  estimatedConversions: number;
  estimatedRevenue: number;
  confidence: number;
}

export interface AiExclusion {
  audience: string;
  reason: string;
}

export interface DecisionTimelineStep {
  id: string;
  title: string;
  value: string;
  detail?: string;
  icon: string;
}

export interface AiWorkspaceResult {
  goal: string;
  reasoning: string;
  knowledgeSnippets: KnowledgeSnippet[];
  audience: AudienceSummary;
  exclusions: AiExclusion[];
  channel: Channel;
  channelReasoning: string;
  message: string;
  subject?: string;
  forecast: CampaignForecast;
  confidenceScores: ConfidenceScore[];
  agentTraces: AgentTrace[];
  timeline: DecisionTimelineStep[];
}

// ─── Playbook Types ───
export interface Playbook {
  id: string;
  title: string;
  description: string;
  category: string;
  snippets: KnowledgeSnippet[];
  usageCount: number;
  lastUsed: string;
}

// ─── Navigation ───
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}
