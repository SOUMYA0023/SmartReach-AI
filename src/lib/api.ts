const CRM_BASE = process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:8000";
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getDashboard: () =>
    fetchJson<{
      total_customers: number;
      total_campaigns: number;
      avg_open_rate: number;
      total_converted: number;
      top_performing_channel: string;
      segment_distribution: Record<string, number>;
      total_sent?: number;
      total_delivered?: number;
      total_opened?: number;
      total_clicked?: number;
    }>(`${CRM_BASE}/analytics/dashboard`),

  // Campaigns
  getCampaigns: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return fetchJson<{ items: ApiCampaign[]; total: number }>(
      `${CRM_BASE}/campaigns${query ? `?${query}` : ""}`
    );
  },

  getCampaign: (id: string) =>
    fetchJson<ApiCampaign>(`${CRM_BASE}/campaigns/${id}`),

  getCampaignAnalytics: (id: string) =>
    fetchJson<ApiCampaignAnalytics>(`${CRM_BASE}/campaigns/${id}/analytics`),

  getCampaignTrace: (id: string) =>
    fetchJson<{ campaign_id: string; agent_runs: unknown[]; decision_timeline: unknown[] }>(
      `${CRM_BASE}/campaigns/${id}/trace`
    ),

  createCampaign: (body: ApiCampaignCreate) =>
    fetchJson<ApiCampaign>(`${CRM_BASE}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  launchCampaign: (id: string) =>
    fetchJson<{ campaign_id: string; status: string; message: string }>(
      `${CRM_BASE}/campaigns/${id}/launch`,
      { method: "POST" }
    ),

  // Campaign generation (AI service, proxied via CRM)
  generateCampaign: (goal: string) =>
    fetchJson<ApiGenerateResult>(`${CRM_BASE}/ai/generate-campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    }),

  // Customers
  getCustomers: (params?: { segment?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.segment) qs.set("segment", params.segment);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return fetchJson<{ items: ApiCustomer[]; total: number }>(
      `${CRM_BASE}/customers${query ? `?${query}` : ""}`
    );
  },

  getCustomer: (id: string) =>
    fetchJson<ApiCustomer>(`${CRM_BASE}/customers/${id}`),

  // Knowledge
  getKnowledge: (params?: { category?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return fetchJson<{ items: ApiKnowledgeDoc[]; total: number }>(
      `${CRM_BASE}/knowledge${query ? `?${query}` : ""}`
    );
  },

  addKnowledge: (body: { title: string; category: string; content: string }) =>
    fetchJson<ApiKnowledgeDoc>(`${CRM_BASE}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiCampaign {
  id: string;
  name: string;
  goal: string;
  channel: string;
  status: string;
  message?: string;
  campaign_type?: string;
  segment?: string;
  predicted_open_rate?: number;
  predicted_ctr?: number;
  predicted_conversion?: number;
  predicted_revenue?: number;
  created_at: string;
}

export interface ApiCampaignCreate {
  name: string;
  goal: string;
  channel: string;
  message?: string;
  campaign_type?: string;
  segment?: string;
  predicted_open_rate?: number;
  predicted_ctr?: number;
  predicted_conversion?: number;
  predicted_revenue?: number;
  audience_filters?: unknown;
  agent_trace?: unknown[];
  decision_timeline?: unknown[];
}

export interface ApiCampaignAnalytics {
  campaign_id: string;
  audience_size: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  delivery_rate: number;
  open_rate: number;
  ctr: number;
  conversion_rate: number;
  predicted_vs_actual: Record<string, { predicted?: number; actual?: number }>;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  segment?: string;
  total_spend: number;
  total_orders: number;
  last_order_date?: string;
  join_date?: string;
  preferred_channel?: string;
}

export interface ApiKnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at?: string;
}

export interface ApiGenerateResult {
  planner?: { campaign_type?: string; objective?: string };
  audience?: { segment?: string; audience_size?: number; filters?: unknown };
  channel?: { channel?: string };
  content?: { message?: string; subject?: string; cta?: string };
  forecast?: {
    open_rate?: number;
    ctr?: number;
    conversion?: number;
    revenue?: number;
    audience_size?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
  decision_timeline?: Array<{ step: string; decision: string; detail?: string; confidence?: number }>;
  agent_trace?: Array<{ agent: string; input?: unknown; output?: unknown; confidence?: number; execution_time?: number }>;
  rag_context?: Array<{ title: string; content: string; score?: number }>;
  errors?: string[];
}
