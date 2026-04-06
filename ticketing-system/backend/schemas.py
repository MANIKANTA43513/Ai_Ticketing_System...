from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class EmployeeBase(BaseModel):
    name: str
    email: str
    department: str
    role: str
    skill_tags: Optional[str] = "[]"
    availability: Optional[str] = "Available"


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    skill_tags: Optional[str] = None
    availability: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    id: int
    avg_resolution_time: float
    current_load: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    title: str
    description: str
    reporter_email: str
    reporter_name: Optional[str] = "Anonymous"


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    note: Optional[str] = None
    actor: Optional[str] = "Agent"


class FeedbackUpdate(BaseModel):
    helpful: bool


class TimelineOut(BaseModel):
    id: int
    action: str
    note: Optional[str]
    actor: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    reporter_email: str
    reporter_name: str
    category: Optional[str]
    ai_summary: Optional[str]
    severity: str
    sentiment: Optional[str]
    resolution_path: Optional[str]
    suggested_department: Optional[str]
    suggested_employee_id: Optional[int]
    confidence_score: Optional[float]
    estimated_resolution_time: Optional[str]
    auto_response: Optional[str]
    status: str
    assigned_to: Optional[int]
    department: Optional[str]
    helpful_feedback: Optional[bool]
    created_at: datetime
    updated_at: datetime
    timeline: List[TimelineOut] = []
    assignee: Optional[EmployeeOut] = None
    suggested_employee: Optional[EmployeeOut] = None

    class Config:
        from_attributes = True


class AnalyticsOut(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    auto_resolved: int
    escalated: int
    auto_resolution_success_rate: float
    department_load: dict
    avg_resolution_by_dept: dict
    top_categories: list
    severity_breakdown: dict
    tickets_by_status: dict
