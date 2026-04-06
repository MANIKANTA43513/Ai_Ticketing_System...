from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, nullable=False)
    skill_tags = Column(Text, default="[]")       # JSON list
    avg_resolution_time = Column(Float, default=4.0)  # hours
    current_load = Column(Integer, default=0)
    availability = Column(String, default="Available")  # Available | Busy | On Leave
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assigned_to", back_populates="assignee")
    suggested_tickets = relationship("Ticket", foreign_keys="Ticket.suggested_employee_id", back_populates="suggested_employee")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reporter_email = Column(String, nullable=False)
    reporter_name = Column(String, default="Anonymous")

    # AI Analysis
    category = Column(String)
    ai_summary = Column(Text)
    severity = Column(String, default="Medium")
    sentiment = Column(String)
    resolution_path = Column(String)
    suggested_department = Column(String)
    suggested_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    confidence_score = Column(Float)
    estimated_resolution_time = Column(String)
    auto_response = Column(Text)
    required_skills = Column(Text, default="[]")

    # Lifecycle
    status = Column(String, default="New")
    assigned_to = Column(Integer, ForeignKey("employees.id"), nullable=True)
    department = Column(String)

    # Feedback
    helpful_feedback = Column(Boolean, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignee = relationship("Employee", foreign_keys=[assigned_to], back_populates="assigned_tickets")
    suggested_employee = relationship("Employee", foreign_keys=[suggested_employee_id], back_populates="suggested_tickets")
    timeline = relationship("TicketTimeline", back_populates="ticket", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ticket", cascade="all, delete-orphan")


class TicketTimeline(Base):
    __tablename__ = "ticket_timeline"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    action = Column(String)
    note = Column(Text)
    actor = Column(String, default="System")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="timeline")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    recipient_email = Column(String)
    message = Column(Text)
    notification_type = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="notifications")
