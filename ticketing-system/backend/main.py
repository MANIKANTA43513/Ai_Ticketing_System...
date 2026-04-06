from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from database import engine, SessionLocal
from models import Base
from routers import tickets, employees, analytics
from seed_data import seed

Base.metadata.create_all(bind=engine)


def run_escalations():
    db = SessionLocal()
    try:
        from routers.tickets import check_escalations
        check_escalations(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed()
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_escalations, "interval", minutes=30)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="AI Ticketing System API",
    version="1.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router, tags=["Tickets"])
app.include_router(employees.router, tags=["Employees"])
app.include_router(analytics.router, tags=["Analytics"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Ticketing System"}
