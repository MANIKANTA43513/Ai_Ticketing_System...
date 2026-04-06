import anthropic
import json
import os
from typing import Optional

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ROUTING_TABLE = {
    "DB": {"department": "Engineering", "priority_bump": "Critical"},
    "Server": {"department": "Engineering", "priority_bump": "Critical"},
    "Billing": {"department": "Finance", "priority_bump": None},
    "HR": {"department": "HR", "priority_bump": None},
    "Access": {"department": "IT", "priority_bump": "High"},
    "Bug": {"department": "Engineering", "priority_bump": None},
    "Feature": {"department": "Engineering", "priority_bump": None},
    "Other": {"department": "IT", "priority_bump": None},
}

AUTO_RESOLVABLE_CATEGORIES = {
    "password reset", "leave policy", "hr policy", "faq", "status update",
    "billing clarification", "onboarding", "tool access instructions"
}

SYSTEM_PROMPT = """You are an expert AI support ticket analyzer for an internal company ticketing system. 
Your job is to analyze support tickets and produce ONLY a valid JSON response with no additional text, markdown, or explanation.

Routing rules:
- DB issues → Engineering (bump to Critical)
- Server/performance → Engineering (bump to Critical)  
- Billing/payroll/salary → Finance
- Leave/HR policy/onboarding → HR
- Access/account lock/permissions → IT (bump to High)
- Product bug/feature request → Engineering
- Legal/compliance → Legal (bump to High)
- Marketing/content/branding → Marketing
- Other/General → IT

Auto-resolvable (no human needed): password resets, HR/leave policy info, general FAQs, status visibility requests, simple billing queries.
Everything else: assign to human."""

ANALYSIS_PROMPT = """Analyze this support ticket and respond ONLY with a JSON object:

Title: {title}
Description: {description}

Return exactly this JSON structure:
{{
  "category": "<Billing|Bug|Access|HR|Server|DB|Feature|Other>",
  "ai_summary": "<2-3 sentence professional summary of the issue and its impact>",
  "severity": "<Critical|High|Medium|Low>",
  "sentiment": "<Frustrated|Neutral|Polite>",
  "resolution_path": "<auto-resolve|assign>",
  "suggested_department": "<department name>",
  "confidence_score": <0.0-1.0>,
  "estimated_resolution_time": "<e.g. 30 minutes|2 hours|1 day|3 days>",
  "auto_response": "<if auto-resolve: professional response addressing the issue specifically. If assign: null>",
  "required_skills": ["<skill1>", "<skill2>"]
}}"""

AUTO_RESPONSE_PROMPT = """You are a helpful IT support agent. Write a professional, specific auto-response for this ticket.
The response must:
1. Address the specific issue raised (not be generic)
2. Provide actionable steps or information
3. End with: "Was this helpful? Please click Yes or No below."
4. Be 3-5 sentences.

Ticket: {title}
Description: {description}"""


def analyze_ticket(title: str, description: str) -> dict:
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": ANALYSIS_PROMPT.format(title=title, description=description)}
            ]
        )
        raw = message.content[0].text.strip()
        # Clean up any markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)

        # Apply routing table override for department
        category = result.get("category", "Other")
        routing = ROUTING_TABLE.get(category, {"department": "IT", "priority_bump": None})
        result["suggested_department"] = routing["department"]

        # Priority bump
        if routing["priority_bump"] and result.get("severity") not in ["Critical"]:
            result["severity"] = routing["priority_bump"]

        # If auto-resolve but no response, generate one
        if result.get("resolution_path") == "auto-resolve" and not result.get("auto_response"):
            result["auto_response"] = generate_auto_response(title, description)

        return result

    except json.JSONDecodeError:
        return _fallback_analysis(title, description)
    except Exception as e:
        print(f"AI Error: {e}")
        return _fallback_analysis(title, description)


def generate_auto_response(title: str, description: str) -> str:
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=512,
            messages=[
                {"role": "user", "content": AUTO_RESPONSE_PROMPT.format(title=title, description=description)}
            ]
        )
        return message.content[0].text.strip()
    except Exception:
        return (
            f"Thank you for contacting support regarding '{title}'. "
            "Based on your request, here are the steps to resolve your issue: "
            "Please check our internal knowledge base or contact your team lead for immediate assistance. "
            "Our team will follow up if further action is needed. "
            "Was this helpful? Please click Yes or No below."
        )


def _fallback_analysis(title: str, description: str) -> dict:
    return {
        "category": "Other",
        "ai_summary": (
            f"A support request was submitted regarding '{title}'. "
            "The system was unable to perform full AI analysis at this time. "
            "Manual review by the support team is recommended."
        ),
        "severity": "Medium",
        "sentiment": "Neutral",
        "resolution_path": "assign",
        "suggested_department": "IT",
        "confidence_score": 0.5,
        "estimated_resolution_time": "1 day",
        "auto_response": None,
        "required_skills": ["General Support"]
    }
