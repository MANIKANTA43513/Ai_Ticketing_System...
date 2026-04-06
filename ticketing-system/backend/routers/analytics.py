from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter, defaultdict
from database import get_db
from models import Ticket, Employee

router = APIRouter()


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).all()

    total = len(tickets)
    open_t = sum(1 for t in tickets if t.status not in ["Resolved", "Closed"])
    resolved = sum(1 for t in tickets if t.status in ["Resolved", "Closed"])
    auto_resolved = sum(1 for t in tickets if t.resolution_path == "auto-resolve" and t.status in ["Resolved", "Closed"])
    escalated = sum(1 for t in tickets if t.severity in ["Critical", "High"] and t.status == "Assigned")

    helpful = sum(1 for t in tickets if t.helpful_feedback == True and t.resolution_path == "auto-resolve")
    auto_total = sum(1 for t in tickets if t.resolution_path == "auto-resolve" and t.helpful_feedback is not None)
    success_rate = round((helpful / auto_total * 100) if auto_total else 0, 1)

    # Department load
    dept_load = defaultdict(int)
    for t in tickets:
        if t.department and t.status not in ["Resolved", "Closed"]:
            dept_load[t.department] += 1

    # Avg resolution time by dept (mock based on category)
    avg_dept = {dept: round(load * 1.5 + 2, 1) for dept, load in dept_load.items()}

    # Top 5 categories this week
    from datetime import datetime, timedelta, timezone
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    week_tickets = [t for t in tickets if t.created_at and t.created_at.replace(tzinfo=timezone.utc) >= week_ago]
    cat_counter = Counter(t.category for t in week_tickets if t.category)
    top_cats = [{"category": k, "count": v} for k, v in cat_counter.most_common(5)]

    # Severity breakdown
    sev_breakdown = {}
    for t in tickets:
        sev_breakdown[t.severity] = sev_breakdown.get(t.severity, 0) + 1

    # Status breakdown
    status_breakdown = {}
    for t in tickets:
        status_breakdown[t.status] = status_breakdown.get(t.status, 0) + 1

    # Recent tickets per day (last 7 days)
    daily = defaultdict(int)
    for t in tickets:
        if t.created_at:
            day = t.created_at.strftime("%Y-%m-%d")
            daily[day] += 1

    return {
        "total_tickets": total,
        "open_tickets": open_t,
        "resolved_tickets": resolved,
        "auto_resolved": auto_resolved,
        "escalated": escalated,
        "auto_resolution_success_rate": success_rate,
        "department_load": dict(dept_load),
        "avg_resolution_by_dept": avg_dept,
        "top_categories": top_cats,
        "severity_breakdown": sev_breakdown,
        "tickets_by_status": status_breakdown,
        "daily_tickets": dict(sorted(daily.items())[-7:]),
    }
