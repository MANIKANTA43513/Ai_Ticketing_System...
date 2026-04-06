from database import SessionLocal, engine
from models import Base, Employee, Ticket, TicketTimeline
import json

Base.metadata.create_all(bind=engine)

EMPLOYEES = [
    # Engineering
    {"name": "Arjun Sharma", "email": "arjun@company.com", "department": "Engineering",
     "role": "Senior Backend Engineer", "skill_tags": json.dumps(["Python", "Database", "SQL", "PostgreSQL", "Backend"]),
     "avg_resolution_time": 3.0, "current_load": 2, "availability": "Available"},
    {"name": "Priya Nair", "email": "priya@company.com", "department": "Engineering",
     "role": "DevOps Engineer", "skill_tags": json.dumps(["Server", "DevOps", "Infrastructure", "Linux", "Networking"]),
     "avg_resolution_time": 2.5, "current_load": 1, "availability": "Available"},
    {"name": "Rahul Verma", "email": "rahul@company.com", "department": "Engineering",
     "role": "Full Stack Developer", "skill_tags": json.dumps(["Bug", "Feature", "React", "Python", "API"]),
     "avg_resolution_time": 4.0, "current_load": 3, "availability": "Busy"},
    {"name": "Sneha Patel", "email": "sneha@company.com", "department": "Engineering",
     "role": "Database Administrator", "skill_tags": json.dumps(["Database", "SQL", "Data Corruption", "PostgreSQL", "DB"]),
     "avg_resolution_time": 2.0, "current_load": 0, "availability": "Available"},

    # IT
    {"name": "Kiran Reddy", "email": "kiran@company.com", "department": "IT",
     "role": "IT Support Lead", "skill_tags": json.dumps(["Access", "Account", "Networking", "Password", "Permissions"]),
     "avg_resolution_time": 1.5, "current_load": 4, "availability": "Available"},
    {"name": "Anjali Gupta", "email": "anjali@company.com", "department": "IT",
     "role": "Systems Administrator", "skill_tags": json.dumps(["Access", "Account Lock", "VPN", "Security", "Password"]),
     "avg_resolution_time": 1.0, "current_load": 2, "availability": "Available"},

    # HR
    {"name": "Deepa Menon", "email": "deepa@company.com", "department": "HR",
     "role": "HR Manager", "skill_tags": json.dumps(["Policy", "Onboarding", "Leave", "Benefits", "HR"]),
     "avg_resolution_time": 5.0, "current_load": 1, "availability": "Available"},
    {"name": "Suresh Kumar", "email": "suresh@company.com", "department": "HR",
     "role": "HR Executive", "skill_tags": json.dumps(["Leave", "Payroll", "Onboarding", "Compliance"]),
     "avg_resolution_time": 4.0, "current_load": 0, "availability": "Available"},

    # Finance
    {"name": "Meera Joshi", "email": "meera@company.com", "department": "Finance",
     "role": "Finance Manager", "skill_tags": json.dumps(["Billing", "Payroll", "Reimbursement", "Salary", "Invoice"]),
     "avg_resolution_time": 6.0, "current_load": 2, "availability": "Available"},
    {"name": "Vikram Singh", "email": "vikram@company.com", "department": "Finance",
     "role": "Accounts Executive", "skill_tags": json.dumps(["Billing", "Reimbursement", "Invoice", "Tax"]),
     "avg_resolution_time": 5.0, "current_load": 1, "availability": "Available"},

    # Legal
    {"name": "Lakshmi Iyer", "email": "lakshmi@company.com", "department": "Legal",
     "role": "Legal Counsel", "skill_tags": json.dumps(["Legal", "Compliance", "Contract", "Policy"]),
     "avg_resolution_time": 24.0, "current_load": 0, "availability": "Available"},

    # Marketing
    {"name": "Rohan Das", "email": "rohan@company.com", "department": "Marketing",
     "role": "Marketing Manager", "skill_tags": json.dumps(["Content", "Branding", "Marketing", "Social Media"]),
     "avg_resolution_time": 8.0, "current_load": 1, "availability": "On Leave"},
    {"name": "Nisha Pillai", "email": "nisha@company.com", "department": "Marketing",
     "role": "Content Specialist", "skill_tags": json.dumps(["Content", "Branding", "Copy", "Design"]),
     "avg_resolution_time": 6.0, "current_load": 0, "availability": "Available"},
]


def seed():
    db = SessionLocal()
    try:
        if db.query(Employee).count() > 0:
            print("Database already seeded.")
            return

        for emp_data in EMPLOYEES:
            emp = Employee(**emp_data)
            db.add(emp)
        db.commit()
        print(f"Seeded {len(EMPLOYEES)} employees.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
