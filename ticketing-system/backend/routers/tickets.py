from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json
from datetime import datetime, timedelta, timezone

from database import get_db
from models import Ticket, Employee, TicketTimeline, Notification
from schemas import TicketCreate, TicketUpdate, TicketOut, FeedbackUpdate
from ai_service import analyze_ticket
from connection_manager import manager

router = APIRouter()


def add_timeline(db: Session, ticket_id: int, action: str, note: str = None, actor: str = "System"):
    entry = TicketTimeline(ticket_id=ticket_id, action=action, note=note, actor=actor)
    db.add(entry)


def find_best_employee(department: str, required_skills: list, db: Session) -> Optional[Employee]:
    candidates = db.query(Employee).filter(
        Employee.is_active == True,
        Employee.availability == "Available",
        Employee.department.ilike(f"%{department.split('/')[0].strip()}%")
    ).all()

    if not candidates:
        candidates = db.query(Employee).filter(
            Employee.is_active == True,
            Employee.availability != "On Leave"
        ).all()

    if not candidates:
        return None

    def score(emp):
        emp_skills = json.loads(emp.skill_tags or "[]")
        skill_match = len(set(s.lower() for s in required_skills) & set(s.lower() for s in emp_skills))
        load_penalty = emp.current_load * 2
        return skill_match * 5 - load_penalty

    return max(candidates, key=score)


def notify(db: Session, ticket_id: int, email: str, msg: str, ntype: str):
    n = Notification(ticket_id=ticket_id, recipient_email=email, message=msg, notification_type=ntype)
    db.add(n)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/tickets", response_model=TicketOut)
async def create_ticket(ticket_in: TicketCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Create ticket
    ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        reporter_email=ticket_in.reporter_email,
        reporter_name=ticket_in.reporter_name,
        status="New"
    )
    db.add(ticket)
    db.flush()

    # AI Analysis
    analysis = analyze_ticket(ticket_in.title, ticket_in.description)

    ticket.category = analysis.get("category")
    ticket.ai_summary = analysis.get("ai_summary")
    ticket.severity = analysis.get("severity", "Medium")
    ticket.sentiment = analysis.get("sentiment")
    ticket.resolution_path = analysis.get("resolution_path")
    ticket.suggested_department = analysis.get("suggested_department")
    ticket.confidence_score = analysis.get("confidence_score")
    ticket.estimated_resolution_time = analysis.get("estimated_resolution_time")
    ticket.auto_response = analysis.get("auto_response")
    ticket.required_skills = json.dumps(analysis.get("required_skills", []))
    ticket.department = analysis.get("suggested_department")

    required_skills = analysis.get("required_skills", [])

    if analysis.get("resolution_path") == "auto-resolve":
        ticket.status = "Resolved"
        add_timeline(db, ticket.id, "Auto-Resolved", f"AI auto-resolved: {analysis.get('auto_response', '')[:100]}...")
        notify(db, ticket.id, ticket.reporter_email,
               f"Your ticket '{ticket.title}' has been auto-resolved.", "auto_resolved")
    else:
        # Find best employee
        dept = analysis.get("suggested_department", "IT")
        best_emp = find_best_employee(dept, required_skills, db)
        if best_emp:
            ticket.suggested_employee_id = best_emp.id
            ticket.assigned_to = best_emp.id
            ticket.status = "Assigned"
            best_emp.current_load += 1
            add_timeline(db, ticket.id, "Assigned", f"Assigned to {best_emp.name} ({best_emp.department})")
            notify(db, ticket.id, best_emp.email,
                   f"New ticket assigned: {ticket.title}", "assigned")
            notify(db, ticket.id, ticket.reporter_email,
                   f"Ticket assigned to {best_emp.name}", "update")
        else:
            add_timeline(db, ticket.id, "Created", "No available employee found; pending assignment.")

    add_timeline(db, ticket.id, "Ticket Created", f"Category: {ticket.category} | Severity: {ticket.severity}")

    db.commit()
    db.refresh(ticket)

    ticket_data = _serialize(ticket)
    background_tasks.add_task(manager.broadcast, {"type": "ticket_created", "ticket": ticket_data})

    return ticket


@router.get("/tickets", response_model=List[TicketOut])
def list_tickets(
    status: Optional[str] = None,
    department: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Ticket)
    if status:
        q = q.filter(Ticket.status == status)
    if department:
        q = q.filter(Ticket.department.ilike(f"%{department}%"))
    if severity:
        q = q.filter(Ticket.severity == severity)
    if category:
        q = q.filter(Ticket.category == category)
    if search:
        q = q.filter(Ticket.title.ilike(f"%{search}%") | Ticket.description.ilike(f"%{search}%"))
    return q.order_by(Ticket.created_at.desc()).all()


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    return t


@router.patch("/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket(ticket_id: int, update: TicketUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")

    old_assignee = t.assigned_to

    if update.status:
        t.status = update.status
        add_timeline(db, ticket_id, f"Status → {update.status}", update.note, update.actor or "Agent")
        notify(db, ticket_id, t.reporter_email, f"Your ticket status updated to {update.status}", "status_update")

    if update.assigned_to is not None:
        # Release old assignee load
        if old_assignee:
            old_emp = db.query(Employee).filter(Employee.id == old_assignee).first()
            if old_emp and old_emp.current_load > 0:
                old_emp.current_load -= 1

        t.assigned_to = update.assigned_to
        new_emp = db.query(Employee).filter(Employee.id == update.assigned_to).first()
        if new_emp:
            new_emp.current_load += 1
            add_timeline(db, ticket_id, "Re-assigned", f"Assigned to {new_emp.name}", update.actor or "Admin")
            notify(db, ticket_id, new_emp.email, f"Ticket re-assigned to you: {t.title}", "assigned")

    elif update.note and not update.status:
        add_timeline(db, ticket_id, "Note Added", update.note, update.actor or "Agent")

    if update.status in ["Resolved", "Closed"] and t.assigned_to:
        emp = db.query(Employee).filter(Employee.id == t.assigned_to).first()
        if emp and emp.current_load > 0:
            emp.current_load -= 1

    db.commit()
    db.refresh(t)
    ticket_data = _serialize(t)
    background_tasks.add_task(manager.broadcast, {"type": "ticket_updated", "ticket": ticket_data})
    return t


@router.post("/tickets/{ticket_id}/feedback")
async def submit_feedback(ticket_id: int, fb: FeedbackUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    t.helpful_feedback = fb.helpful
    add_timeline(db, ticket_id, "Feedback", f"User marked: {'Helpful' if fb.helpful else 'Not Helpful'}", "User")
    db.commit()
    background_tasks.add_task(manager.broadcast, {"type": "feedback", "ticket_id": ticket_id, "helpful": fb.helpful})
    return {"message": "Feedback recorded"}


@router.get("/notifications/{email}")
def get_notifications(email: str, db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        Notification.recipient_email == email
    ).order_by(Notification.created_at.desc()).limit(20).all()


def check_escalations(db: Session):
    """Escalate High/Critical tickets not picked up within 2 hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    tickets = db.query(Ticket).filter(
        Ticket.severity.in_(["High", "Critical"]),
        Ticket.status == "Assigned",
        Ticket.created_at < cutoff
    ).all()
    for t in tickets:
        alt = find_best_employee(t.department or "IT", json.loads(t.required_skills or "[]"), db)
        if alt and alt.id != t.assigned_to:
            if t.assigned_to:
                old = db.query(Employee).filter(Employee.id == t.assigned_to).first()
                if old and old.current_load > 0:
                    old.current_load -= 1
            t.assigned_to = alt.id
            alt.current_load += 1
            add_timeline(db, t.id, "Escalated", f"Auto-escalated to {alt.name} after 2h", "System")
    db.commit()


def _serialize(t: Ticket) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "status": t.status,
        "severity": t.severity,
        "category": t.category,
        "department": t.department,
        "resolution_path": t.resolution_path,
        "reporter_email": t.reporter_email,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }
