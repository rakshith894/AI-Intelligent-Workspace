# 🧠 AI Intelligent Workspace

> A next-generation, AI-driven project management and collaboration platform engineered for high-velocity software and product teams. Built with modern FastAPI, React 19, PostgreSQL, and multimodal AI copilots.

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)

---

## 🌟 Key Features

### 🤖 Intelligent AI Capabilities
- **Workspace AI Copilot**: Context-aware AI assistant grounded on your workspace projects, deliverables, and backlog. Supports multimodal inputs (image/photo analysis and document attachments).
- **Multi-Provider LLM Integration**: Connect your own API keys for **OpenAI** (`gpt-4o`, `gpt-4o-mini`), **Groq** (`llama-3.3-70b-versatile`), **OpenRouter**, or use the high-performance **Built-in Workspace Heuristics Engine**.
- **Automated Task Decomposition**: Break complex user stories and engineering tasks into structured, estimated subtasks and tag recommendations in seconds.
- **Sprint Diagnostics & Health Scoring**: Real-time algorithmic analysis detecting sprint velocity, overdue deliverables, bottlenecks, and actionable recommendations.
- **Automated Daily Standup Generator**: One-click generation of comprehensive daily standups categorized by completed milestones, in-flight work, and blockers.
- **Smart Workload Balancing & Auto-Assign**: Evaluates member workload distribution and capacity to recommend the optimal assignee for newly created tasks.
- **Semantic Knowledge Base Search**: Query across all workspace tasks, project docs, and deliverables with instant contextual answers.

### 🏢 Workspace & Project Management
- **Multi-Tenant Workspaces**: Switch seamlessly across multiple organizations and workspace environments.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `Owner`, `Admin`, `Member`, and `Viewer`.
- **Project Tracking & Workspaces**: Organize initiatives with statuses, categories, progress tracking, and file uploads.
- **Tasks & Backlogs**: Rich task details, priority matrices (`Low`, `Medium`, `High`, `Urgent`), status lifecycles (`Todo`, `In Progress`, `Review`, `Done`), subtasks, due dates, and custom color-coded labels.
- **Interactive Discussions & Task Comments**: Threaded discussions with activity history on deliverables.
- **Workload Analytics**: Visual workload distributions and deliverable completion metrics powered by Recharts.
- **GitHub Integration**: Connect personal GitHub accounts to inspect repositories and sync code intelligence.
- **Notification Engine**: In-app notifications and configurable SMTP/Gmail email alert preferences.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client[React 19 + Vite Frontend / Nginx] -->|REST API / JSON| Backend[FastAPI Application Layer]
    Backend -->|SQLAlchemy ORM| DB[(PostgreSQL 16 Database)]
    Backend -->|OpenAI / Groq / OpenRouter| LLM[External LLM Providers]
    Backend -->|SMTP / TLS| Email[Email Notification Service]
    Backend -->|Octokit / REST| GitHub[GitHub API]
```

### 💻 Frontend
- **Framework**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- **Build Tool**: [Vite](https://vitejs.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + `@tailwindcss/vite`
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query)
- **Icons & Animations**: [Lucide React](https://lucide.dev) & [Framer Motion](https://www.framer.com/motion)
- **Data Visualizations**: [Recharts](https://recharts.org)
- **Routing**: [React Router DOM v7](https://reactrouter.com)

### ⚙️ Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com)
- **ORM & DB Access**: [SQLAlchemy 2.0](https://www.sqlalchemy.org) with `psycopg3`
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org)
- **Data Validation & Settings**: [Pydantic v2](https://docs.pydantic.dev) & `pydantic-settings`
- **Authentication**: JWT (`python-jose` / `pyjwt`), password hashing with `passlib` & `bcrypt`

### 🐳 Infrastructure & Deployment
- **Containerization**: Docker multi-stage builds with Alpine bases
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (serving static SPA assets and reverse-proxying)
- **Database**: PostgreSQL 16 Alpine with persistent volume storage

---

## 📁 Repository Structure

```text
AI-Intelligent-Workspace/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py       # Auth dependencies & token parsers
│   │   │   ├── permission.py         # Workspace RBAC enforcement
│   │   │   └── routes/               # API endpoints (AI, Auth, Tasks, etc.)
│   │   ├── core/
│   │   │   ├── config.py             # App environment & settings
│   │   │   ├── database.py           # DB engine & session makers
│   │   │   └── security.py           # Password hashing & JWT logic
│   │   ├── events/                   # Async event triggers & listeners
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── schemas/                  # Pydantic request & response schemas
│   │   ├── services/                 # Core business & AI logic
│   │   └── main.py                   # FastAPI app entrypoint & middleware
│   ├── migrations/                   # Alembic schema migration versions
│   ├── uploads/                      # Uploaded files & attachment assets
│   ├── Dockerfile                    # Backend container definition
│   └── requirements.txt              # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/               # Shared UI elements & modals
│   │   ├── layouts/                  # App layouts & sidebars
│   │   ├── pages/                    # Workspace, Tasks, AI, Analytics views
│   │   ├── services/                 # Axios API clients
│   │   ├── App.tsx                   # Main React routing tree
│   │   └── main.tsx                  # React entry point
│   ├── Dockerfile                    # Frontend container definition
│   └── package.json                  # Node packages & build scripts
├── .env.example                      # Sample production environment variables
├── docker-compose.yml                # Multi-container service configuration
└── README.md                         # Project documentation
```

---

## 🚀 Quick Start with Docker (Recommended)

The quickest way to run the full stack with PostgreSQL, FastAPI backend, and React frontend is using Docker Compose:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/AI-Intelligent-Workspace.git
cd AI-Intelligent-Workspace
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
*(Customize `SECRET_KEY` and database credentials in `.env` as needed).*

### 3. Launch Services
```bash
docker-compose up --build -d
```

### 4. Access the Application
- 🌐 **Frontend Application**: [http://localhost](http://localhost) (or port configured)
- 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📚 **Swagger Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📖 **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: `v20+` & `npm`
- **Python**: `3.11+` or `3.12+`
- **PostgreSQL**: `15+` or `16`

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows PowerShell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure backend `.env`:**
   Create `backend/.env` with your local settings:
   ```env
   APP_NAME="AI Intelligent Workspace"
   ENVIRONMENT=development
   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/workspace_db
   SECRET_KEY=your_development_secret_key_change_me_32chars
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
   EMAILS_ENABLED=false
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start Vite development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Visit `http://localhost:5173` to start using the workspace.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default | Example |
|---|---|---|---|
| `POSTGRES_USER` | PostgreSQL user name | `postgres` | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` | `super_secret_pw` |
| `POSTGRES_DB` | PostgreSQL database name | `workspace_db` | `workspace_db` |
| `DATABASE_URL` | Full SQLAlchemy DB connection string | - | `postgresql+psycopg://user:pw@db:5432/workspace_db` |
| `SECRET_KEY` | JWT signing cryptographic key | - | `random_32_character_string` |
| `ENVIRONMENT` | Deployment stage (`development` / `production`) | `production` | `production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration duration in minutes | `1440` (24h) | `1440` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains | `http://localhost:5173` | `https://app.example.com` |
| `SMTP_HOST` | SMTP server for email notifications | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` | `587` |
| `SMTP_USER` | SMTP username / sender email | `""` | `alerts@example.com` |
| `SMTP_PASSWORD` | SMTP password / app password | `""` | `xxxx-xxxx-xxxx-xxxx` |
| `EMAILS_ENABLED` | Toggle email dispatch on events | `false` | `true` |
| `FRONTEND_URL` | Base URL used for invitation email links | `http://localhost:5173` | `https://app.example.com` |

---

## 📡 API Overview

| Route Prefix | Tag | Description |
|---|---|---|
| `/api/v1/auth` | Authentication | Register, login, refresh token, and session validation |
| `/api/v1/users/me` | Profile & Identity | Fetch and update current authenticated user profile |
| `/api/v1/workspaces` | Workspace & RBAC | Multi-tenant organization CRUD and member invitations |
| `/api/v1/workspaces/{id}/projects` | Projects | Project creation, templates, and progress tracking |
| `/api/v1/workspaces/{id}/tasks` | Tasks & Deliverables | Task lifecycle, priorities, labels, and subtasks |
| `/api/v1/workspaces/{id}/ai` | AI Intelligence | Copilot chat, task breakdown, sprint health, standup, auto-assign |
| `/api/v1/workspaces/{id}/analytics` | Analytics | Deliverable velocity, completion rate, and workload telemetry |
| `/api/v1/notifications` | Notifications | In-app alerts, read status, and delivery preferences |
| `/api/v1/users/me/github` | GitHub Integration | GitHub account connection, OAuth token validation, repo listing |

---

## 🧪 Testing

Run backend test suites:
```bash
cd backend
pytest
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).