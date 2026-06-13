<div align="center">
  <h1>🚀 SmartReach AI</h1>
  <p><strong>Autonomous AI-Driven Marketing & CRM Orchestration Platform</strong></p>

  <p>
    <a href="https://reactjs.org/" target="_blank"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://nextjs.org/" target="_blank"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <br />
    <a href="https://www.python.org/" target="_blank"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
    <a href="https://fastapi.tiangolo.com/" target="_blank"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://www.postgresql.org/" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://redis.io/" target="_blank"><img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" /></a>
    <a href="https://docs.celeryq.dev/" target="_blank"><img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" /></a>
    <br />
    <a href="https://www.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
    <a href="https://deepmind.google/technologies/gemini/" target="_blank"><img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" /></a>
    <a href="https://langchain-ai.github.io/langgraph/" target="_blank"><img src="https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=&logoColor=white" alt="LangGraph" /></a>
  </p>
</div>

---

## 📖 Overview

**SmartReach AI** is an advanced, microservices-based CRM and marketing orchestration platform. It replaces disjointed marketing tools with a unified pipeline that handles everything from AI-driven campaign planning and copy generation to asynchronous simulated delivery and real-time analytics. 

By leveraging **LangGraph** for multi-agent reasoning and **pgvector** for Retrieval-Augmented Generation (RAG), SmartReach AI makes deterministic marketing decisions grounded in actual business data and historical knowledge.

👉 **For a deep dive into the architecture, design decisions, and system flow, read the [Complete Project Documentation](./PROJECT_DOCUMENTATION.md) and view the [Architecture Diagram](./architecture.md).**

---

## ✨ Key Features

- 🤖 **Multi-Agent AI Pipeline:** Five specialized LangGraph agents (Planner, Audience, Channel, Content, Forecast) cooperate to generate hyper-personalized marketing campaigns from a simple natural language prompt.
- 🧠 **Native pgvector RAG:** Seamlessly embed and search historical marketing knowledge using Google Gemini 768-dimensional embeddings natively within PostgreSQL.
- 📊 **Dynamic RFM Segmentation:** Automatically segments users (e.g., VIP, At Risk, Dormant) based on transaction history (Recency, Frequency, Monetary).
- 🔮 **Deterministic ROI Forecasting:** Mathematical heuristic engine that predicts expected Open Rates, CTRs, and Revenue based on channel heuristics and cohort multipliers.
- 📬 **Asynchronous Channel Simulation:** A dedicated, delayed simulation layer that mocks external vendors (Twilio/SendGrid) and asynchronously processes delivery via Celery task queues.
- 🔄 **Idempotent Webhooks:** Handles real-world network challenges with Redis-backed locks, ensuring analytics are tracked flawlessly without duplicate event counting.
- 🛡️ **Prompt Injection Security:** Custom `PromptGuardService` blocks jailbreak attempts before they reach the LLMs.

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS, shadcn/ui
- **Language:** TypeScript

### Backend (Microservices)
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 16 (with `pgvector` extension)
- **ORM:** SQLAlchemy (Async), Alembic (Migrations)
- **Message Broker & Cache:** Redis
- **Task Queue:** Celery (Isolated `crm_queue` & `channel_queue`)

### AI & Machine Learning
- **LLM Provider:** Google Gemini API (`models/gemini-embedding-2`, generative models)
- **Orchestration:** LangGraph (Stateful Multi-Agent Workflows)

### Infrastructure
- **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+)
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SOUMYA0023/SmartReach-AI.git
   cd SmartReach-AI
   ```

2. **Configure Environment Variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Open `backend/.env` and insert your API key:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

3. **Spin up the Backend Services**
   The backend uses Docker Compose to orchestrate Postgres, Redis, the APIs, and Celery workers.
   ```bash
   docker compose up --build -d
   ```
   Wait 1-2 minutes for the database to initialize and Alembic migrations to run automatically.

4. **Seed the Database (Optional but Recommended)**
   To make the dashboard look realistic, you can generate 500 fake customers and 2,000 orders.
   ```bash
   docker exec backend-crm-api-1 python seed_db.py
   ```

5. **Start the Frontend**
   Open a new terminal window and navigate to the root directory.
   ```bash
   npm install
   npm run dev
   ```

6. **Access the Application**
   - Frontend Dashboard: `http://localhost:3000`
   - CRM API Swagger Docs: `http://localhost:8000/docs`
   - AI Service Swagger Docs: `http://localhost:8001/docs`

---

## 🕹️ Using the Application

1. **Upload Knowledge (RAG):** Go to the AI Workspace in the frontend and add Brand Guidelines or historical campaign successes to teach the AI your brand voice.
2. **Generate Campaign:** Type a goal such as *"Bring back dormant users who haven't ordered in 3 months"*. 
3. **Review AI Plan:** The LangGraph pipeline will output a selected audience, recommended channel, predicted open rates, and drafted copy.
4. **Launch:** Click Launch to save the campaign to Postgres.
5. **Watch the Magic:** 
   - The Celery `crm-worker` dynamically pulls the target audience and dispatches messages to the `channel-worker`.
   - The `channel-worker` simulates network latency (sleeping 15-150s).
   - The simulator fires Webhooks back to the CRM API.
   - Refresh the Analytics dashboard to watch the `Sent`, `Delivered`, and `Opened` metrics update in real time!

---

## 📚 Documentation

For an exhaustive audit of the codebase, business logic, testing strategies, and future roadmap, please consult the core documentation:

- 📄 **[Project Documentation](./PROJECT_DOCUMENTATION.md)** (10,000+ words covering every API, worker, model, and graph node)
- 🗺️ **[Architecture Diagram & Audit](./architecture.md)** (Mermaid diagrams detailing microservice boundaries)

---

<div align="center">
  <i>Built with ❤️ by Soumya</i>
</div>
