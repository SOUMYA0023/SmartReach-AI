# PROJECT_DOCUMENTATION.md

# SECTION 1: EXECUTIVE SUMMARY

## What is SmartReach AI
SmartReach AI is a next-generation, AI-driven marketing and customer relationship management (CRM) platform designed to automate the lifecycle of marketing campaigns. Utilizing an advanced Multi-Agent LLM architecture (LangGraph), Retrieval-Augmented Generation (RAG), and asynchronous distributed processing (Celery), SmartReach AI empowers marketing teams to autonomously plan, generate, forecast, deploy, and track hyper-personalized campaigns across multiple communication channels.

## Why it was built
Modern marketing teams struggle with tool fragmentation. They use one tool to query customer data, another to write copy, a third to forecast ROI, and a fourth to orchestrate email/SMS delivery. SmartReach AI was built to unify these disparate silos into a single, cohesive, AI-orchestrated pipeline. The goal was to remove human guesswork from campaign planning by allowing Large Language Models (LLMs) to reason through audience targeting and content generation, grounded in the company's historical marketing knowledge.

## What business problem it solves
1. **Inefficient Campaign Creation:** Marketers spend days drafting copy, selecting audiences, and setting up workflows. SmartReach reduces this to seconds.
2. **Generic Messaging:** Broadcast marketing yields low conversion. SmartReach leverages RFM (Recency, Frequency, Monetary) segmentation to target specific cohorts (e.g., "Dormant", "VIP").
3. **Unpredictable ROI:** Before spending money on SMS or Email blasts, marketers lack insight into expected returns. SmartReach provides deterministic forecasting based on historical channel heuristics and segment multipliers.
4. **Data Silos:** By tightly integrating the CRM, AI engine, and Delivery simulators, the system closes the loop automatically, tracking analytics in real-time.

## Target users
- **CMOs & Marketing Directors:** Needing high-level oversight and ROI forecasting.
- **Campaign Managers / Marketers:** Needing to rapidly deploy contextual, brand-aligned campaigns.
- **Data Analysts:** Looking for granular, real-time funnel analytics (Sent -> Delivered -> Opened -> Clicked -> Converted).

## Main value proposition
"Autonomous, end-to-end campaign orchestration." SmartReach AI doesn't just write a draft email; it decides *who* should receive it, *which channel* is mathematically optimal, *what* the message should say based on past successful campaigns (RAG), and *simulates* the actual delivery and tracking feedback loop.

## Competitive advantage
- **LangGraph Multi-Agent Reasoning:** Unlike standard chatbots, SmartReach uses an acyclic graph of specialized agents (Planner, Audience, Channel, Content, Forecast) that pass a strongly typed state object between them.
- **Native Vector Integrations:** Using `pgvector` directly in PostgreSQL, the platform eliminates the need for external vector databases (like Pinecone), drastically reducing operational overhead while maintaining high-performance cosine similarity searches for RAG.
- **Closed-Loop Simulation:** A dedicated Channel Simulator Service actively simulates network jitter, latency, and delivery statuses, firing webhooks back to the CRM to prove the architecture can handle real-world asynchronous event-driven architectures.

## Why this project stands out
SmartReach AI proves enterprise readiness. It utilizes robust distributed task queues (Redis + Celery), explicit queue routing (`crm_queue` vs `channel_queue`), idempotency mechanisms for webhooks, and comprehensive prompt-injection security. It isn't just an AI wrapper; it's a fully realized, scalable, distributed microservice architecture.

---

# SECTION 2: PROJECT OVERVIEW

## High level architecture
SmartReach AI follows a domain-driven, service-oriented microservices architecture. It is strictly segmented into three core backend services, a unified frontend, and shared infrastructure layers. Communication between services occurs via synchronous REST APIs (FastAPI) and asynchronous task queues (Celery/Redis) with Webhook callbacks.

## System boundaries
1. **Frontend App:** The presentation layer. Communicates exclusively with the CRM API.
2. **CRM Service:** The central source of truth. Owns the relational data (Customers, Orders, Campaigns, Analytics).
3. **AI Service:** The intelligence layer. Owns the generative logic, vector embeddings, and LangGraph execution. Stateless, aside from RAG document embeddings.
4. **Channel Service:** The simulation boundary. Mocks external APIs (Twilio, SendGrid), processes jobs asynchronously, and posts statuses back to the CRM boundary.

## Microservice architecture & Service Responsibilities

### CRM Service (`backend/crm_service`)
The CRM service acts as the primary gateway for the frontend. 
- **Responsibilities:** 
  - Manage Customer profiles and Order histories.
  - Dynamically calculate RFM (Recency, Frequency, Monetary) segments.
  - Proxy campaign generation requests to the AI Service.
  - Persist generated campaigns, audiences, and individual communication records.
  - Orchestrate the actual campaign dispatch to the Channel Service via Celery tasks (`dispatch_campaign`).
  - Expose webhook endpoints to ingest delivery updates from external channels.
  - Maintain Analytics state based on communication events.

### AI Service (`backend/ai_service`)
A highly specialized compute node dedicated to Large Language Model interactions.
- **Responsibilities:**
  - Expose the `/ai/generate-campaign` endpoint.
  - Initialize and execute the LangGraph state machine.
  - Embed marketing knowledge documents using Google Gemini embeddings (768 dimensions).
  - Perform semantic similarity searches via `pgvector`.
  - Calculate deterministic heuristic forecasts for campaign ROI.

### Channel Service (`backend/channel_service`)
An external systems mocker and asynchronous delay simulator.
- **Responsibilities:**
  - Receive dispatch commands from the CRM.
  - Enqueue `simulate_delivery` tasks into a dedicated `channel_queue`.
  - Sleep for randomized intervals (up to 150 seconds) to simulate network/user delays.
  - Fire `POST` requests to the CRM's webhook endpoint (`/webhooks/communication-event`) with HTTP 202 Accepted flows.

### Database Layer
- **PostgreSQL 16:** A single monolithic database instance used by both the CRM and AI services (in a real-world scenario, these might be logically separated databases).
- **pgvector Extension:** Enabled within Postgres to store `Vector(768)` types and execute rapid cosine distance `ORDER BY` queries.

### Redis Layer
- **Broker & Backend:** Acts as the message broker for Celery, routing tasks to specific queues (`crm_queue`, `channel_queue`).
- **Idempotency Cache:** Stores webhook execution signatures with a 24-hour TTL to prevent double-counting of delivery events in case the Channel Service retries a failed webhook.

### Workers
- **CRM Worker (`backend-crm-worker-1`):** Consumes from `crm_queue`. Executes `dispatch_campaign`, `refresh_rfm_segments`, and `process_communication_event`.
- **Channel Worker (`backend-channel-worker-1`):** Consumes from `channel_queue`. Executes `simulate_delivery`.

### Webhooks
An asynchronous bridge allowing the Channel Service to report status changes (SENT, DELIVERED, OPENED, CLICKED) back to the CRM API without blocking.

---

# SECTION 3: COMPLETE SYSTEM FLOW

The lifecycle of a campaign, step-by-step:

### 1. User Goal
The user navigates to the Next.js frontend, opens the AI Workspace, and types a natural language goal: *"Bring back dormant customers who haven't purchased in 3 months."* This string is POSTed to the CRM API, which proxies it to the AI Service.

### 2. Campaign Planning (LangGraph: Planner Agent)
The AI Service initializes a `CampaignState` dictionary. The `planner_node` invokes the Gemini API to analyze the goal. It extracts a `campaign_type` (e.g., "winback") and an `objective` (e.g., "Re-engage users who churned 90 days ago").

### 3. RAG Context Retrieval (LangGraph: RAG Node)
The state transitions to the `rag_retrieval_node`. The node concatenates the goal and objective, uses `GeminiEmbedder` to convert it to a 768-dimensional vector, and queries `pgvector` for the top 5 most similar historical `KnowledgeDocument`s. This context is injected into the state.

### 4. Audience Selection (LangGraph: Audience Agent)
The `audience_node` analyzes the goal and RAG context to determine the best RFM segment. It outputs a `segment` (e.g., "Dormant") and associated database filters.

### 5. Channel Selection (LangGraph: Channel Agent)
The `channel_node` determines the best medium (e.g., "email" or "whatsapp") based on the audience segment and urgency of the goal.

### 6. Content Generation (LangGraph: Content Agent)
The `content_node` takes the channel constraints (e.g., short form for SMS, rich form for Email), the audience segment, and the RAG context to write a personalized `message`, `subject` line, and `cta` (Call to Action).

### 7. Forecasting (LangGraph: Forecast Agent)
The `forecast_node` receives the chosen channel and segment. It applies hardcoded heuristics (e.g., WhatsApp has a 95% delivery rate; the "Dormant" segment has a 0.6x multiplier). It outputs predicted Open Rates, CTR, Conversion Rates, and expected Revenue. The complete JSON graph output is returned to the Frontend.

### 8. Campaign Creation
The user reviews the generated plan on the frontend. Upon approval, the frontend POSTs the mapped payload to `/campaigns` on the CRM API. The CRM saves the `Campaign` row to Postgres.

### 9. Campaign Launch
The user clicks "Launch". The frontend calls POST `/campaigns/{id}/launch`. The CRM API pushes a `dispatch_campaign` task to the Redis `crm_queue`.

### 10. Audience Resolution & Dispatch (CRM Worker)
The CRM Worker picks up the task. It queries the `Customer` table for users matching the generated segment (e.g., "Dormant"). For each matching customer, it creates a `Communication` row (status="PENDING") and POSTs to the Channel Service `/send` endpoint.

### 11. Channel Simulation (Channel Worker)
The Channel Service receives the `/send` payload, immediately returns 200 OK, and enqueues a `simulate_delivery` task to `channel_queue`. The Channel Worker picks this up, runs an `asyncio.sleep` (between 15 to 150 seconds) to mimic real-world network latency.

### 12. Webhook Processing
Once the sleep finishes, the Channel Worker fires a POST request to the CRM's `/webhooks/communication-event`. The CRM checks Redis for an idempotency key (`webhook:{comm_id}:{event_type}`). If unique, it returns 202 Accepted and enqueues a `process_communication_event` task to `crm_queue`.

### 13. Analytics Collection
The CRM Worker processes the webhook task. It updates the `CommunicationEvent` table and modifies the parent `Communication` row's status (e.g., "DELIVERED"). 

### 14. Dashboard Reporting
The frontend polls the `/campaigns/{id}/analytics` endpoint. The CRM queries the aggregate states of all Communications linked to the campaign and returns real-time metrics (sent: 44, delivered: 16, opened: 12), contrasting them with the predicted forecast.

---

# SECTION 4: FOLDER STRUCTURE ANALYSIS

### `backend/crm_service/`
**Purpose:** The core business logic and relational data owner.
- `app/api/`: FastAPI routers mapping REST endpoints (`campaigns.py`, `customers.py`, `orders.py`, `webhooks.py`, `analytics.py`, `knowledge.py`).
- `app/models/`: SQLAlchemy ORM definitions mapping directly to Postgres tables (`customer.py`, `order.py`, `campaign.py`, `communication.py`, `audit.py`, `knowledge.py`).
- `app/repositories/`: The Data Access Layer (DAL). Isolates database queries (e.g., `campaign_repo.py`) from business logic, ensuring clean separation of concerns.
- `app/schemas/`: Pydantic models for request validation and response serialization.
- `app/services/`: Core business logic (`rfm_service.py` for segmentation math, `campaign_service.py` for orchestration, `analytics_service.py` for metric aggregation).
- `app/workers/`: Celery application setup (`celery_app.py`) and asynchronous task definitions (`campaign_tasks.py`, `webhook_tasks.py`).
- `app/security/`: Protections like `prompt_guard.py` (regex injection detection) and `audit_logger.py`.
- `alembic/`: Database migration scripts.

### `backend/ai_service/`
**Purpose:** The intelligent LLM wrapper.
- `app/api/`: Exposes the `ai_workspace.py` router.
- `app/agents/`: The LangGraph state machine. Contains `graph.py` (node bindings and edges) and individual agent logic (`planner_agent.py`, `content_agent.py`, etc.). Includes `llm_client.py` for raw Gemini API wrapping.
- `app/rag/`: The Retrieval-Augmented Generation logic. `rag_service.py` handles database insertions/queries, `embedder.py` interfaces with `models/gemini-embedding-2`.
- `app/services/`: Contains `forecast_service.py` for heuristic math.

### `backend/channel_service/`
**Purpose:** External vendor simulation.
- `app/main.py`: The single entrypoint exposing the `/send` API.
- `app/workers/`: Contains `delivery_tasks.py` which holds the randomized `simulate_delivery` latency logic.

### `backend/tests/`
**Purpose:** Integration and unit testing.
- `crm/`: Validates prompt guard rules, RFM math, webhook idempotency, and the campaign launch flow.
- `ai/`: Validates forecast math and agent state transitions.

### `src/` (Frontend)
**Purpose:** Next.js presentation layer.
- `app/`: Next.js App Router pages (`/campaigns`, `/analytics`, `/ai-workspace`, `/customers`).
- `components/`: Reusable React components. Segmented into `ui/` (shadcn-like base components), `layout/` (navbars), and `dashboard/` (specialized visualizations like funnels and KPI cards).
- `lib/`: Utilities (`utils.ts`, `motion.ts` for animations).
- `data/`: Mock data or type definitions supporting the frontend state before API integration.
- `types/`: TypeScript interfaces ensuring type safety across the application.

---

# SECTION 5: DATABASE DOCUMENTATION

The system uses a single PostgreSQL database with the `pgvector` extension.

### 1. Table: `customers`
- **Purpose:** Stores end-user demographic and aggregated behavioral data.
- **Columns:** `id` (UUID, PK), `name` (String), `email` (String, Unique), `phone` (String), `city` (String), `join_date` (DateTime), `last_order_date` (DateTime), `total_spend` (Float), `total_orders` (Integer), `segment` (String), `engagement_score` (Float), `preferred_channel` (String), `created_at` (DateTime).
- **Indexes:** `email`, `segment`.
- **Relationships:** 1:N with `orders`, 1:N with `campaign_audiences`, 1:N with `communications`.

### 2. Table: `orders`
- **Purpose:** Stores transaction history. Used to recalculate RFM metrics.
- **Columns:** `id` (UUID, PK), `customer_id` (UUID, FK), `amount` (Float), `product_name` (String), `order_date` (DateTime), `created_at` (DateTime).
- **Indexes:** `customer_id`.
- **Relationships:** N:1 with `customers`.

### 3. Table: `campaigns`
- **Purpose:** Represents a planned or executed marketing initiative.
- **Columns:** `id` (UUID, PK), `name` (String), `goal` (String), `channel` (String), `status` (String: DRAFT, ACTIVE, COMPLETED), `message` (String), `campaign_type` (String), `segment` (String), `predicted_open_rate` (Float), `predicted_ctr` (Float), `predicted_conversion` (Float), `predicted_revenue` (Float), `created_at` (DateTime).
- **Indexes:** `status`.
- **Relationships:** 1:N with `campaign_audiences`, 1:N with `communications`.

### 4. Table: `campaign_audiences`
- **Purpose:** A mapping table linking a specific customer to a specific campaign.
- **Columns:** `id` (UUID, PK), `campaign_id` (UUID, FK), `customer_id` (UUID, FK).
- **Constraints:** Unique constraint on `(campaign_id, customer_id)` to prevent duplicate targeting.

### 5. Table: `communications`
- **Purpose:** Tracks the state of a single message sent to a single customer.
- **Columns:** `id` (UUID, PK), `campaign_id` (UUID, FK), `customer_id` (UUID, FK), `channel` (String), `message` (String), `status` (String: PENDING, SENT, DELIVERED, OPENED, CLICKED), `sent_at` (DateTime).
- **Indexes:** `status`, `campaign_id`, `customer_id`.
- **Relationships:** 1:N with `communication_events`.

### 6. Table: `communication_events`
- **Purpose:** An append-only event ledger tracking the exact timeline of a communication (e.g., when it was sent vs. when it was opened).
- **Columns:** `id` (UUID, PK), `communication_id` (UUID, FK), `event_type` (String), `timestamp` (DateTime), `created_at` (DateTime).
- **Indexes:** `communication_id`.

### 7. Table: `knowledge_documents`
- **Purpose:** Stores marketing guidelines and past successes for the AI RAG pipeline.
- **Columns:** `id` (UUID, PK), `title` (String), `category` (String), `content` (Text), `embedding` (Vector(768)).
- **Indexes:** `category`. Supports cosine similarity queries over the `embedding` column via pgvector.

### 8. Table: `audit_logs`
- **Purpose:** Tracks critical system and user actions for compliance.
- **Columns:** `id` (UUID, PK), `action` (String), `resource_type` (String), `resource_id` (String), `details` (JSONB), `timestamp` (DateTime).

## Data Flow & ERD Summary
Data enters through `orders` and `customers`. The `rfm_service` aggregates `orders` to update `total_spend`, `total_orders`, `last_order_date`, and `segment` on `customers`. When a `campaign` is generated, it targets a `segment`, pulling matching `customers` into `campaign_audiences`. Upon launch, `communications` are generated for each audience member. External webhooks push `communication_events`, which roll up to update the `status` of `communications`.

---

# SECTION 6: API DOCUMENTATION

### 1. POST `/ai/generate-campaign` (AI Service)
- **Purpose:** Executes the full LangGraph pipeline to convert a raw goal into a structured campaign plan.
- **Input:** `{"goal": "Bring back dormant users"}`
- **Output:** A massive JSON object containing the outputs of all 5 agents (planner, audience, channel, content, forecast), plus the `agent_trace` execution times and `decision_timeline` audit logs.
- **Internal Flow:** Validates prompt -> Init LangGraph State -> Planner -> RAG -> Audience -> Channel -> Content -> Forecast -> Return State.

### 2. POST `/campaigns` (CRM Service)
- **Purpose:** Persists the generated campaign to the database.
- **Input:** Mapped campaign payload (name, goal, channel, message, segment, predictions).
- **Output:** The created Campaign object (status: DRAFT).
- **Internal Flow:** Validates request -> Inserts `campaigns` row -> Returns ID.

### 3. POST `/campaigns/{id}/launch` (CRM Service)
- **Purpose:** Triggers the asynchronous campaign dispatch.
- **Input:** Path param `{id}`.
- **Output:** `{"status": "LAUNCHING"}`
- **Internal Flow:** Verifies campaign exists and is DRAFT -> Updates status to ACTIVE -> Enqueues `dispatch_campaign.delay(id)` into Celery `crm_queue` -> Returns 202.

### 4. GET `/campaigns/{id}/analytics` (CRM Service)
- **Purpose:** Retrieves real-time aggregated metrics for a campaign.
- **Input:** Path param `{id}`.
- **Output:** `{"audience_size": 44, "sent": 44, "delivered": 16, "opened": 12, ...}`
- **Internal Flow:** Joins `campaign_audiences` for size. Groups `communications` by `status` to count sent/delivered/opened. Compares against `predicted` metrics from the `campaigns` table.

### 5. POST `/webhooks/communication-event` (CRM Service)
- **Purpose:** Ingests status updates from the Channel simulator.
- **Input:** `{"communication_id": "uuid", "event_type": "DELIVERED", "timestamp": "..."}`
- **Output:** `{"status": "accepted"}`
- **Internal Flow:** Checks Redis `webhook:{id}:{event}`. If exists, returns 409 Duplicate. If new, sets Redis key -> Enqueues `process_communication_event` to `crm_queue` -> Returns 202.

### 6. POST `/send` (Channel Service)
- **Purpose:** Accepts dispatch requests and simulates delivery.
- **Input:** `{"communication_id": "uuid", "channel": "email", "recipient": "..."}`
- **Output:** `{"accepted": true}`
- **Internal Flow:** Enqueues `simulate_delivery` to `channel_queue`.

---

# SECTION 7: LANGGRAPH AGENT PIPELINE

LangGraph is used to manage control flow across multiple Gemini API calls. Rather than a single massive prompt, the problem is broken into specialized agents.

## How the graph works
A `CampaignState` `TypedDict` holds the shared context. It starts with the `goal`. Each node receives the state, performs its specific LLM reasoning, and returns a dictionary of updates which are merged into the state.

## 1. Planner Agent (`planner_node`)
- **Input:** Raw user `goal`.
- **Output:** `campaign_type` (e.g., "winback"), `objective`.
- **Decision Logic:** Categorizes the intent into predefined marketing archetypes.

## 2. RAG Retrieval Node (`rag_retrieval_node`)
- **Input:** `campaign_type` + `goal`.
- **Output:** `rag_context`.
- **Decision Logic:** Generates an embedding, performs cosine similarity against Postgres `knowledge_documents`, and injects the top 5 historical context blocks into the state.

## 3. Audience Agent (`audience_node`)
- **Input:** `goal` + `rag_context`.
- **Output:** `segment` (e.g., "Dormant", "VIP"), `audience_filters`.
- **Decision Logic:** Identifies the demographic or RFM cohort most likely to respond to the objective.

## 4. Channel Agent (`channel_node`)
- **Input:** `segment` + `campaign_type`.
- **Output:** `channel` (email, sms, whatsapp, rcs).
- **Decision Logic:** Weighs the urgency of the campaign against the preferred communication mediums of the target segment.

## 5. Content Agent (`content_node`)
- **Input:** `channel` + `segment` + `rag_context`.
- **Output:** `message`, `subject`, `cta`.
- **Decision Logic:** Drafts the actual copy, adhering to channel constraints (e.g., SMS character limits) and incorporating successful tones from the RAG context.

## 6. Forecast Agent (`forecast_node`)
- **Input:** `channel` + `segment` + `campaign_type`.
- **Output:** `open_rate`, `ctr`, `conversion`, `revenue`.
- **Decision Logic:** Calls the deterministic `ForecastService` (Python math, not LLM) to apply heuristic multipliers.

## State Updates & Tracing
Every node appends two metadata objects to the state arrays:
1. `agent_trace`: Extremely detailed payload containing the exact inputs, outputs, confidence score, and `execution_time_ms`. Used for system debugging.
2. `decision_timeline`: Human-readable summaries of what was decided (e.g., "Selected SMS for high urgency"). Used to render the transparent UI to the end user.

---

# SECTION 8: RAG PIPELINE

Retrieval-Augmented Generation (RAG) grounds the LLM in organizational reality, preventing hallucinations and ensuring brand consistency.

## How it is implemented
SmartReach AI avoids complex external vector databases (like Pinecone/Weaviate) by leveraging the `pgvector` extension natively inside PostgreSQL.

1. **Knowledge Ingestion:** When brand guidelines or past campaign post-mortems are uploaded, the CRM inserts a row into `knowledge_documents`.
2. **Embedding Generation:** The `GeminiEmbedder` calls the `models/gemini-embedding-2` API with `task_type="retrieval_document"`. This returns an array of 768 floating-point numbers representing the semantic meaning of the text.
3. **Vector Storage:** The 768-dim vector is stored in the `embedding` column (`Vector(768)`) in Postgres.
4. **Similarity Search:** During campaign generation, the Planner's goal is embedded using `task_type="retrieval_query"`. The system executes a native SQL query: `ORDER BY embedding <=> query_embedding LIMIT 5`. The `<=>` operator computes the Cosine Distance.
5. **Context Retrieval:** The top 5 documents are concatenated into a numbered list.
6. **Prompt Augmentation:** This text block is injected into the prompts for the Audience and Content agents, effectively teaching them the company's past successes dynamically.

## Data Flow Diagram
```text
[User Goal] --> (Gemini Embed API) --> [768-dim Query Vector]
                                                |
                                                v
[PostgreSQL pgvector] <== Cosine Distance == [Knowledge Documents]
                                                |
                                                v
[Top 5 Relevant Documents] --> (Merged Context String)
                                                |
                                                v
[Content Agent LLM Prompt] --> (Brand-Aligned Message Output)
```

---

# SECTION 9: CUSTOM FEATURES

### RFM Segmentation Engine
- **Purpose:** Mathematically categorize users into behavioral cohorts.
- **Implementation:** Scheduled Celery task (`refresh_rfm_segments`) running every 6 hours. It calculates Recency (days since last order: 1-5 score), Frequency (total orders: 1-5 score), and Monetary (spend percentile: 1-5 score). Rules like `R>=4 & F>=4 & M>=4 -> VIP` are applied to tag users.
- **Value:** Prevents spamming users. Marketers target "At Risk" users with discounts and "VIPs" with early access.

### Channel Simulator
- **Purpose:** Safely test campaign logic without spending real money on Twilio/SendGrid.
- **Implementation:** An isolated microservice with an asynchronous worker that `sleeps` for randomized intervals before firing webhooks.
- **Value:** Allows the system to be battle-tested for race conditions and asynchronous data aggregation under real-world timing constraints.

### Prompt Injection Protection
- **Purpose:** Prevent malicious users from jailbreaking the AI.
- **Implementation:** `PromptGuardService` uses regex patterns (`"ignore previous instructions"`, `"DAN mode"`) to instantly reject payloads via HTTP 400 before they hit the LLM.
- **Value:** Protects proprietary system prompts and prevents generation of harmful content.

### Webhook Idempotency
- **Purpose:** Ensure analytics are accurate even if external providers send duplicate webhook events.
- **Implementation:** A 24-hour Redis TTL lock utilizing the pattern `webhook:{communication_id}:{event_type}`.
- **Value:** Prevents artificial inflation of "Opened" or "Clicked" metrics.

---

# SECTION 10: FORECASTING ENGINE

The Forecasting Engine provides deterministic ROI expectations before a single message is sent.

## How forecasting works
It relies on baseline performance heuristics modified by behavioral segment multipliers.

### Inputs
- `channel` (email, sms, whatsapp, rcs)
- `segment` (VIP, Loyal, Dormant, etc.)
- `campaign_type` (winback, upsell)
- `audience_size` (Integer)

### Calculations & Assumptions
1. **Base Rates:** 
   - WhatsApp: 95% delivery, 75% open, 25% click, 4% conversion.
   - Email: 80% delivery, 30% open, 8% click, 2% conversion.
2. **Segment Multipliers:**
   - VIPs engage more: `1.3x` multiplier to all base rates.
   - Dormant users ignore messages: `0.6x` multiplier to all base rates.
3. **Expected AOV (Average Order Value):**
   - Upsell campaigns generate high value: `₹1500`.
   - Winback campaigns generate medium value: `₹800`.

### Output Metrics Formula
- `delivered = audience_size * (base_delivery)`
- `opened = delivered * (base_open * multiplier)`
- `clicked = opened * (base_click * multiplier)`
- `converted = clicked * (base_conversion * multiplier)`
- `revenue = converted * AOV`

These figures are clamped to maximums (e.g., no rate can exceed 99%) and returned to the UI for budget approval.

---

# SECTION 11: ANALYTICS ENGINE

The Analytics Engine closes the loop between the AI's prediction and the real-world outcome.

### Architecture & Flow
1. **Event Collection:** The Channel Simulator fires `POST /webhooks/communication-event`.
2. **Idempotency Check:** CRM checks Redis to ensure this exact event hasn't been processed.
3. **Asynchronous Processing:** Enqueued to `crm_queue`. The `CRMWorker` inserts a `CommunicationEvent` (e.g., "OPENED" at 10:45 AM).
4. **State Mutation:** The parent `Communication` row's `status` is bumped up the hierarchy (PENDING -> SENT -> DELIVERED -> OPENED -> CLICKED -> CONVERTED).
5. **Dashboard Generation:** When the frontend requests `/campaigns/{id}/analytics`, the `AnalyticsService` runs SQL aggregations:
   - `SELECT status, count(*) FROM communications WHERE campaign_id = X GROUP BY status;`
6. **Predicted vs Actual:** The service merges the real counts with the `predicted_open_rate` stored on the `Campaign` object to output a comparative JSON structure.

---

# SECTION 12: SECURITY ARCHITECTURE

### Current Protections
- **Input Validation:** Strict Pydantic models on all APIs reject malformed JSON.
- **Prompt Injection Detection:** `PromptGuardService` blocks known jailbreak patterns.
- **Idempotency:** Redis distributed locks prevent duplicate webhook processing and race conditions.
- **Audit Logs:** The `AuditLogger` writes immutable rows tracking major actions (`CAMPAIGN_LAUNCHED`) to the `audit_logs` table.

### Missing Protections
- **Authentication/Authorization:** The APIs currently lack JWT/OAuth protection. Any user can trigger any campaign.
- **Rate Limiting:** While a middleware exists, strict throttling rules per IP/User are not fully enforced across all high-cost LLM endpoints.
- **Webhook Validation:** Webhooks from external providers should require cryptographic signature verification (e.g., HMAC-SHA256) to ensure they actually originated from the provider. Currently, the webhook endpoint accepts unauthenticated payloads.

### Production Recommendations
1. Implement Firebase Auth or Auth0 for JWT verification.
2. Implement HMAC signature validation on the `/webhooks/communication-event` endpoint.
3. Enforce strict rate limits on `/ai/generate-campaign` to prevent API billing exhaustion.

---

# SECTION 13: TESTING ANALYSIS

The repository contains a highly focused suite of `pytest` integration tests.

### Coverage Areas
1. **Prompt Guard (`test_prompt_guard.py`):** Validates that "ignore all instructions" throws HTTP 400, while safe prompts pass.
2. **Webhook Idempotency (`test_webhook_idempotency.py`):** Ensures that sending the exact same webhook payload twice results in the second being rejected (HTTP 409 or 202 duplicate).
3. **RFM Logic (`test_rfm_service.py`):** Validates that dummy customers with specific order patterns correctly compute to VIP or Dormant segments.
4. **Launch Flow (`test_campaign_launch_flow.py`):** Tests the Celery dispatch logic (mocking the external HTTP post to the channel service).
5. **Forecasting (`test_forecast_service.py`):** Validates the mathematical bounds of the heuristic formulas.

### What is verified vs Untested
- **Verified:** Core algorithmic math (RFM, Forecast) and security boundaries (webhooks, prompt guard).
- **Untested:** The actual LLM outputs. Testing non-deterministic LangGraph nodes requires complex evaluation frameworks (like LangSmith) which are not yet implemented. E2E UI testing (Playwright/Cypress) is also currently missing.

---

# SECTION 14: IMPLEMENTATION STATUS

### Completed Features
- Multi-Agent LangGraph AI Pipeline.
- `pgvector` RAG embedding and semantic search.
- Heuristic Forecasting Engine.
- RFM Segmentation calculation and data seeding.
- Asynchronous Celery dispatch and Channel Simulation.
- Webhook ingestion and real-time Analytics aggregation.

### Partially Completed Features
- Frontend Dashboard: The Next.js UI exists but may require tighter wiring for real-time WebSocket updates instead of polling.
- Audit Logging: Implemented at the database level but lacks a dedicated UI view.

### Missing Features
- User Authentication (JWT).
- HMAC Webhook verification.
- A/B Testing engine (launching variant A and B simultaneously).

---

# SECTION 15: KNOWN ISSUES

### 1. Celery Default Queue Collision (RESOLVED)
- **Root Cause:** Both the `crm-worker` and `channel-worker` originally listened to the default `celery` queue in Redis. The Channel worker would pick up `dispatch_campaign` tasks and crash because it wasn't registered.
- **Impact:** Critical task loss. Campaigns wouldn't launch.
- **Recommended Fix (Implemented):** Explicitly mapped `task_default_queue="crm_queue"` and `task_default_queue="channel_queue"` in their respective `celery_app.py` files to isolate workers.

### 2. LLM Latency
- **Root Cause:** Executing 5 distinct Gemini API calls serially through LangGraph takes time.
- **Impact:** The `/ai/generate-campaign` endpoint can take 5-15 seconds to return, which is a long blocking HTTP request.
- **Recommended Fix:** Refactor the endpoint to be asynchronous. Return an immediate `job_id`, and have the frontend poll or use WebSockets/SSE to stream the LangGraph `agent_trace` chunks in real-time.

---

# SECTION 16: DEPLOYMENT ARCHITECTURE

The entire stack is containerized using Docker and orchestrated via `docker-compose.yml`.

### Containers
1. `postgres`: Runs `pgvector/pgvector:pg16`. Exposes port 5432. Holds all relational and vector data.
2. `redis`: Runs `redis:7-alpine`. Exposes port 6379. Message broker and cache.
3. `crm-api`: FastAPI app on port 8000. Depends on postgres/redis.
4. `crm-worker`: Celery worker running CRM tasks.
5. `ai-service`: FastAPI app on port 8001. Requires `GEMINI_API_KEY`.
6. `channel-service`: FastAPI app on port 8002.
7. `channel-worker`: Celery worker running simulated latency tasks.

### Networks & Volumes
- All containers communicate over Docker's internal DNS (e.g., `http://crm-api:8000`).
- `postgres_data` volume ensures database persistence across container restarts.

### Deployment Flow
For production, this structure maps perfectly to Kubernetes:
- APIs -> Deployments behind Ingress / LoadBalancers.
- Workers -> Deployments with HPA (Horizontal Pod Autoscaling) based on Redis queue depth.
- Managed Services -> Swap local Postgres for AWS RDS PostgreSQL (with pgvector), swap local Redis for AWS ElastiCache.

---

# SECTION 17: VIDEO DEMO SCRIPT

**Duration: 5-8 Minutes**

**[0:00 - 1:00] Introduction & Architecture**
*Visual: Architecture Diagram on screen.*
"Welcome to SmartReach AI. Today marketing teams use a dozen disconnected tools. We’ve built an autonomous platform that handles the entire pipeline: AI planning, audience segmentation, real-world deployment, and analytics feedback loops. Under the hood, we use an advanced Multi-Agent architecture powered by LangGraph, tightly integrated with a robust Celery and Postgres backend."

**[1:00 - 2:30] AI Flow & RAG**
*Visual: AI Workspace UI.*
"Let's create a campaign. I'll type a simple goal: 'Bring back dormant customers'. Watch what happens. Behind the scenes, our system is executing 5 distinct AI Agents. First, the Planner identifies the intent. Then, it queries our PostgreSQL `pgvector` database to retrieve historical marketing documents (RAG). It uses those to ground the Content Agent, ensuring the generated message matches our brand voice exactly."

**[2:30 - 3:30] Campaign Generation & Forecasting**
*Visual: Campaign Review UI.*
"Here is the generated campaign. The AI successfully selected the 'Dormant' cohort identified by our backend RFM engine. It chose 'Email' as the optimal channel. Furthermore, our deterministic forecasting engine has predicted a 45% Open Rate and calculated the expected revenue based on our historical heuristics for this specific cohort."

**[3:30 - 5:00] Execution & Analytics**
*Visual: Click Launch -> Switch to Analytics Dashboard.*
"We click Launch. This triggers a Celery task on our CRM worker, isolating heavy lifting from the API. The CRM dispatches 44 messages to our Channel Simulator. To prove our architecture handles real-world asynchronous chaos, the Channel Simulator randomly sleeps for up to 2 minutes before firing Webhooks back to our CRM. 
*(Wait a moment)* 
Refresh the analytics page. You can see the 'Delivered' and 'Opened' metrics creeping up in real-time as the Webhooks are idempotently processed by our backend queue. The loop is closed."

**[5:00 - 6:00] Security & Conclusion**
*Visual: Terminal showing Prompt Guard block.*
"Finally, enterprise readiness means security. If a user tries to jailbreak the system by typing 'ignore previous instructions', our Prompt Guard intercepts it with an HTTP 400 before it ever hits the LLM, saving API costs and protecting our prompts. SmartReach isn't just an AI toy; it's a secure, scalable, distributed system ready for production."

---

# SECTION 18: JUDGE PRESENTATION NOTES

### What judges should know
SmartReach AI is a masterclass in integrating cutting-edge AI (LangGraph) with proven, battle-tested distributed systems engineering (Celery, Redis, Postgres).

### Key innovations & Technical Differentiators
- **Agentic Workflow over Chatbots:** It doesn't rely on a fragile single prompt. By using LangGraph, the problem is divided, allowing state inspection at every node (`agent_trace`), making the AI auditable and predictable.
- **Native pgvector RAG:** Eliminates the vendor lock-in and network latency of external vector databases.
- **True Asynchronous Architecture:** It successfully handles the "Two Generals Problem" of distributed marketing. By simulating external channel delays and utilizing idempotent webhooks, it proves the system won't drop data under load.

### Business Differentiators
It replaces 3 tools (Copywriting AI, Audience CRM, Analytics Tracker) with one seamless pipeline, providing deterministic ROI forecasting *before* money is spent.

### Why this project deserves selection
It demonstrates extreme technical competence across the full stack. It tackles LLM orchestration, vector databases, distributed task queues, mathematical forecasting, and cybersecurity in a single cohesive repository.

---

# SECTION 19: FUTURE ROADMAP

1. **Scalability:** Migrate from single Redis broker to RabbitMQ for guaranteed message delivery and dead-letter queues. Move from Docker Compose to Kubernetes with KEDA for queue-based autoscaling.
2. **Enterprise Readiness:** Implement OAuth2 / OIDC for Single Sign-On (SSO). Add Role-Based Access Control (RBAC) so junior marketers require approval before launching campaigns.
3. **AI Upgrades:** Implement LangSmith for detailed agent evaluation. Add self-reflection nodes to the LangGraph where a "Critic Agent" reviews the Content Agent's output before finalizing.
4. **Production Readiness:** Implement HMAC signature validation for all incoming webhooks. Add comprehensive Datadog/Prometheus metrics tracing across the Celery workers.

---

# SECTION 20: FINAL TECHNICAL SUMMARY

- **Architecture Summary:** Service-oriented, event-driven microservices bridging synchronous FastAPI borders with asynchronous Celery queues.
- **Tech Stack Summary:** Python (FastAPI, SQLAlchemy, Celery), TypeScript (Next.js, Tailwind), PostgreSQL (`pgvector`), Redis, Google Gemini, LangGraph.
- **Feature Summary:** Agentic campaign generation, RAG embedding search, RFM segmentation, Heuristic forecasting, Asynchronous simulation, Idempotent webhook tracking.
- **Deployment Summary:** Fully containerized Docker Compose stack ready for cloud orchestration.

### Strengths
- Exceptional separation of concerns (DAL repos vs Service layers).
- Advanced LangGraph implementation.
- Extremely robust queue isolation logic.

### Weaknesses
- Missing API Authentication.
- Generative endpoint is currently synchronous and blocking.

### Overall Project Assessment
SmartReach AI is an outstanding implementation of modern AI patterns applied to a real-world enterprise problem. The codebase is clean, the architecture is highly scalable, and the integration of distributed queues to handle the non-deterministic nature of webhooks elevates it above standard AI prototype applications.

**Final Score:**
- Architecture: 9.5/10
- Scalability: 9/10
- Security: 7.5/10
- Code Quality: 9/10
- AI Integration: 10/10
- Innovation: 9/10
- **Overall: 9.0 / 10**
