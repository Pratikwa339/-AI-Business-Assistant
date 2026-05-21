import os
import io
import csv
import logging
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from dotenv import load_dotenv
from google import genai

from database import engine, get_db
from models import Base, Lead
from automation import send_email, log_lead_to_csv

# ─── Configuration ──────────────────────────────────────────────────────

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# ─── Gemini AI Setup ────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    logger.info("Gemini AI client initialized successfully.")
else:
    logger.warning("GEMINI_API_KEY not found — chatbot will return fallback responses.")

SYSTEM_PROMPT = """You are an AI-powered business assistant for Codenixia — a leading technology 
education and consulting company. Your role is to help users with:

1. **Course Information**: AI/ML, Data Science, Full-Stack Development, Cloud Computing, DevOps, 
   Cybersecurity, and Automation programs.
2. **Business Consulting**: Provide guidance on digital transformation, tech stack selection, 
   and automation strategies for businesses.
3. **Internship Programs**: Share details about Codenixia's internship opportunities in AI, 
   LLM development, and automation engineering.
4. **General Queries**: Answer technology-related questions professionally and concisely.

Guidelines:
- Be professional, friendly, and concise.
- Use bullet points and structured formatting when listing information.
- If you don't know something specific about Codenixia, provide general industry-relevant advice.
- Always encourage users to submit their details through the Lead Form for personalized follow-up.
- Keep responses under 300 words unless the user asks for detailed explanations.
"""

# ─── FastAPI App ─────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Business Automation Assistant API",
    description="Backend API for the AI-Powered Business Automation Assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ──────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class LeadRequest(BaseModel):
    name: str
    email: str
    phone: str
    message: str = ""


class LeadStatusUpdate(BaseModel):
    status: str  # new, contacted, converted


# ─── Routes ─────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "AI Business Automation Assistant",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/chat")
def chat(data: ChatRequest):
    """AI Chatbot endpoint — generates responses using Gemini 2.5 Flash."""
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if not client:
        return {"reply": "AI service is currently unavailable. Please try again later or contact us through the Lead Form."}

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{SYSTEM_PROMPT}\n\nUser Question:\n{data.message}",
        )
        return {"reply": response.text}
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail="AI service encountered an error. Please try again.")


@app.post("/lead")
def create_lead(data: LeadRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Create a new lead and trigger automation workflows."""
    if not data.name.strip() or not data.email.strip() or not data.phone.strip():
        raise HTTPException(status_code=400, detail="Name, email, and phone are required.")

    try:
        # 1. Store lead in database
        new_lead = Lead(
            name=data.name.strip(),
            email=data.email.strip(),
            phone=data.phone.strip(),
            message=data.message.strip(),
            status="new",
        )
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        # 2. Queue automation tasks in the background
        background_tasks.add_task(log_lead_to_csv, new_lead.name, new_lead.email, new_lead.phone, new_lead.message)
        background_tasks.add_task(send_email, new_lead.name, new_lead.email, new_lead.phone, new_lead.message)

        logger.info(f"New lead created and automations queued: {new_lead.email} (ID: {new_lead.id})")

        return {
            "message": "Lead submitted successfully!",
            "lead": new_lead.to_dict(),
            "automations": {
                "queued": True,
            },
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Lead creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit lead. Please try again.")


@app.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    """Retrieve all leads for the dashboard."""
    try:
        leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
        return [lead.to_dict() for lead in leads]
    except Exception as e:
        logger.error(f"Failed to fetch leads: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leads.")


@app.get("/leads/export")
def export_leads_csv(db: Session = Depends(get_db)):
    """Export all leads as a downloadable CSV file."""
    try:
        leads = db.query(Lead).order_by(Lead.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Email", "Phone", "Message", "Status", "Created At"])
        for lead in leads:
            writer.writerow([
                lead.id, lead.name, lead.email, lead.phone,
                lead.message, lead.status,
                lead.created_at.isoformat() if lead.created_at else ""
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=leads_export_{datetime.now().strftime('%Y%m%d')}.csv"},
        )
    except Exception as e:
        logger.error(f"CSV export failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to export leads.")


@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Delete a lead by ID."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    try:
        db.delete(lead)
        db.commit()
        return {"message": f"Lead {lead_id} deleted successfully."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete lead {lead_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete lead.")


@app.patch("/leads/{lead_id}/status")
def update_lead_status(lead_id: int, data: LeadStatusUpdate, db: Session = Depends(get_db)):
    """Update the status of a lead."""
    valid_statuses = ["new", "contacted", "converted"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    try:
        lead.status = data.status
        db.commit()
        db.refresh(lead)
        return {"message": f"Lead status updated to '{data.status}'.", "lead": lead.to_dict()}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update lead status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update lead status.")


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Dashboard statistics endpoint."""
    try:
        total_leads = db.query(sql_func.count(Lead.id)).scalar() or 0

        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        leads_today = db.query(sql_func.count(Lead.id)).filter(Lead.created_at >= today).scalar() or 0

        status_counts = {}
        for status in ["new", "contacted", "converted"]:
            count = db.query(sql_func.count(Lead.id)).filter(Lead.status == status).scalar() or 0
            status_counts[status] = count

        # Recent leads (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        leads_this_week = db.query(sql_func.count(Lead.id)).filter(Lead.created_at >= week_ago).scalar() or 0

        conversion_rate = round((status_counts.get("converted", 0) / total_leads * 100), 1) if total_leads > 0 else 0

        return {
            "total_leads": total_leads,
            "leads_today": leads_today,
            "leads_this_week": leads_this_week,
            "conversion_rate": conversion_rate,
            "status_breakdown": status_counts,
        }
    except Exception as e:
        logger.error(f"Failed to compute stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics.")
