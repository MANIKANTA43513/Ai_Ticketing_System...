🤖 Advanced AI Ticketing System
A smart internal ticketing platform where Claude AI reads incoming tickets, auto-resolves simple ones, and intelligently routes complex ones to the right department and employee.

🚀 Tech Stack
Layer	Technology
AI/LLM	Claude 3.5 Sonnet (Anthropic)
Backend	FastAPI + SQLite + SQLAlchemy
Frontend	React + Vite + TailwindCSS
Real-time	WebSockets
Deployment	Render (backend) + Vercel (frontend)
✅ All 6 Modules Implemented
Module 1 — AI Ticket Analysis: Category, summary (2–3 sentences, shown in blue), severity, sentiment, routing, confidence score, estimated time
Module 2 — Auto-Resolution Engine: Instant AI responses for FAQs, HR policies, password resets. Feedback loop (Yes/No) for success rate tracking
Module 3 — Department Routing: Smart routing table (DB→Engineering Critical, Access→IT High, etc.)
Module 4 — Employee Directory: Skill-based + load-aware + availability-aware assignment
Module 5 — Ticket Lifecycle: New→Assigned→In Progress→Pending Info→Resolved→Closed, timeline, auto-escalation at 2h for High/Critical
Module 6 — Analytics Dashboard: Live charts — dept load, severity, status, daily volume, top categories, AI success rate
Bonus: Real-time updates via WebSocket (no page refresh needed)

🛠️ Local Setup (5 minutes)
Prerequisites
Python 3.10+
Node.js 18+
Anthropic API key (get from https://console.anthropic.com)
Step 1 — Backend
cd backend

# Copy env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
The backend will:

Auto-create SQLite database (ticketing.db)
Seed 13 employees across 6 departments
Start at http://localhost:8000
API docs at http://localhost:8000/docs
Step 2 — Frontend
cd frontend

# Install dependencies
npm install

# Copy env file (no changes needed for local dev)
cp .env.example .env

# Start dev server
npm run dev
Frontend runs at http://localhost:5173 (proxies API calls to backend automatically)

🌐 Production Deployment
Backend → Render
Push code to GitHub
Go to https://render.com → New → Web Service
Connect your repo, set Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Add environment variables:
ANTHROPIC_API_KEY = your key
ALLOWED_ORIGINS = https://your-app.vercel.app
Add a Disk (for SQLite persistence): mount at /data, update DATABASE_URL to sqlite:////data/ticketing.db
Frontend → Vercel
Go to https://vercel.com → New Project → Import from GitHub
Set Root Directory: frontend
Add environment variables:
VITE_API_URL = https://your-render-app.onrender.com
VITE_WS_URL = wss://your-render-app.onrender.com
Deploy!
🧠 AI Prompt Design
The AI analysis uses a structured JSON contract approach — the routing logic depends only on the structured output (not free-form text). Key design decisions:

System prompt defines the role and strict routing rules
User prompt uses a JSON template forcing structured output
Fallback gracefully handles API failures with sensible defaults
Routing table in Python overrides the AI's department suggestion to ensure consistency
Auto-resolution is determined by Claude but verified against known resolvable categories
📁 Project Structure
ticketing-system/
├── backend/
│   ├── main.py              # FastAPI app + lifespan
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # DB models
│   ├── schemas.py           # Pydantic schemas
│   ├── ai_service.py        # Claude AI integration
│   ├── connection_manager.py # WebSocket manager
│   ├── seed_data.py         # 13 seed employees
│   ├── requirements.txt
│   └── routers/
│       ├── tickets.py       # Tickets + WebSocket + escalation
│       ├── employees.py     # Employee CRUD
│       └── analytics.py     # Analytics aggregation
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/index.js     # Axios API layer
    │   ├── hooks/useWebSocket.js  # Real-time hook
    │   ├── components/
    │   │   ├── Layout.jsx   # Sidebar + nav + WS connection
    │   │   ├── AIAnalysisCard.jsx  # Blue AI summary card
    │   │   ├── TicketCard.jsx
    │   │   └── StatusBadge.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Tickets.jsx  # Filters + real-time banner
    │       ├── NewTicket.jsx
    │       ├── TicketDetail.jsx  # Full lifecycle management
    │       ├── Employees.jsx     # Admin directory
    │       └── Analytics.jsx     # 6 charts
    └── vercel.json
⚠️ Known Limitations
SQLite not suitable for high-concurrency production (switch to PostgreSQL on Render)
Escalation runs on a 30-minute interval (not exact 2-hour SLA)
Email notifications are simulated (stored in DB, not actually sent)
WebSocket connections reconnect automatically but may have brief gaps
🎥 Video Coverage Guide (5 min)
(0:30) Intro: "AI ticketing system using Claude — auto-resolves simple tickets, routes complex ones"
(2:00) Walk through all 6 pages: Dashboard → New Ticket → real-time update → Ticket Detail with AI analysis → Employees → Analytics
(1:30) Show 3 scenarios: password reset (auto-resolved), server down (critical routing), billing query
(0:30) Prompt design: JSON contract approach, why structured output over free text
(0:30) Limitation: SQLite → PostgreSQL for production scale
