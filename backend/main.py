from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from typing import List
from datetime import datetime
import hashlib
import bcrypt
import os

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Evidence Locker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_pw(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_audit(db: Session, user_id: int, action: str, details: str, tx: str = None):
    log = models.AuditLog(user_id=user_id, action=action, details=details, blockchain_tx=tx)
    db.add(log)
    db.commit()


# ═══════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════

@app.post("/api/auth/send-registration-otp")
def send_registration_otp(body: dict):
    badge = body.get("badge_id", "").strip()
    if not badge:
        raise HTTPException(400, "Badge ID required")
        
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.ethereal.email")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "msfx77wiuhj2cp74@ethereal.email")
    smtp_pass = os.environ.get("SMTP_PASS", "kwMA2rENZz4MSVQZmz")
    
    import random
    reset_otp = str(random.randint(100000, 999999))
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Digital Evidence Locker <{smtp_user}>"
        msg['To'] = f"{badge}@dept.gov.in"
        msg['Subject'] = f"Registration OTP - {reset_otp}"
        
        body_text = f"""
        Welcome to the Judicial Blockchain Network.
        
        Your registration OTP for Service ID {badge} is: {reset_otp}
        
        This email was sent via a live SMTP integration. View live inbox at:
        https://ethereal.email/login (Use {smtp_user} and {smtp_pass})
        """
        msg.attach(MIMEText(body_text, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        return {
            "message": "OTP Dispatched",
            "otp_sent": True,
            "mock_otp": reset_otp # Returning it in response for Hackathon UI validation ease since it's a demo
        }
    except Exception as e:
        raise HTTPException(500, f"SMTP Error: {str(e)}")

@app.post("/api/auth/register")
def register(body: dict, db: Session = Depends(get_db)):
    badge = body.get("badge_id", "").strip()
    name = body.get("name", "").strip()
    password = body.get("password", "")
    role = body.get("role", "Officer")

    if not badge or not name or not password:
        raise HTTPException(400, "All fields are required")

    if db.query(models.User).filter(models.User.badge_id == badge).first():
        raise HTTPException(400, "Badge ID already registered")

    user = models.User(
        username=badge.lower().replace(" ", "-"),
        hashed_password=hash_pw(password),
        name=name,
        role=role,
        badge_id=badge,
        department="Self-Registered",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit(db, user.id, "USER REGISTERED", f"{name} ({role}) registered with ID {badge}.")
    return {"message": "Registration successful"}


import jwt
from datetime import timedelta

SECRET_KEY = "SIH_2026_EVIDENCE_LOCKER_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/api/auth/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.badge_id == user_data.badge_id,
        models.User.role == user_data.role
    ).first()

    if not user or not verify_pw(user_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials or role mismatch")

    # Log action
    create_audit(db, user.id, "LOGIN", f"{user.name} logged in as {user.role}.")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.badge_id, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "role": user.role,
        "name": user.name,
        "badge_id": user.badge_id,
        "user_id": user.id
    }

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@app.post("/api/auth/forgot-password")
def forgot_password(body: dict, db: Session = Depends(get_db)):
    badge_id = body.get("badge_id")
    user = db.query(models.User).filter(models.User.badge_id == badge_id).first()
    
    if not user:
        raise HTTPException(404, "Service ID not found in records.")
        
    # Using Ethereal Email (Real SMTP test service) for live demo out of the box
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.ethereal.email")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "msfx77wiuhj2cp74@ethereal.email")
    smtp_pass = os.environ.get("SMTP_PASS", "kwMA2rENZz4MSVQZmz")
    
    # Generate 6-digit OTP
    import random
    reset_otp = str(random.randint(100000, 999999))
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Digital Evidence Locker <{smtp_user}>"
        msg['To'] = f"{user.badge_id}@dept.gov.in" # Simulating department email
        msg['Subject'] = f"URGENT: Password Reset OTP - {reset_otp}"
        
        body_text = f"""
        Dear {user.name},
        
        A password recovery request was initiated for your Judicial Blockchain Network account (ID: {user.badge_id}).
        
        Your real-time secure OTP is: {reset_otp}
        
        Please enter this OTP in the application to proceed with the password reset.
        If you did not request this, please contact the IT cell immediately.
        
        This email was sent via a live SMTP integration. You can view the live inbox at:
        https://ethereal.email/login (Use {smtp_user} and {smtp_pass})
        
        Regards,
        Digital Evidence Locker System
        """
        msg.attach(MIMEText(body_text, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        create_audit(db, user.id, "PASSWORD_RESET_REQUEST", f"OTP generated and dispatched to {user.badge_id}.")
        return {
            "message": "Real-time OTP has been dispatched via SMTP.",
            "otp_sent": True,
            "inbox_url": "https://ethereal.email/login",
            "test_user": smtp_user,
            "test_pass": smtp_pass
        }
    except Exception as e:
        raise HTTPException(500, f"SMTP Error: {str(e)}")


# ═══════════════════════════════════════════
#  CASES
# ═══════════════════════════════════════════

@app.get("/api/cases", response_model=List[schemas.Case])
def get_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Case).order_by(models.Case.created_at.desc()).offset(skip).limit(limit).all()


@app.post("/api/cases", response_model=schemas.Case)
def create_case(case: schemas.CaseCreate, db: Session = Depends(get_db)):
    db_case = models.Case(**case.model_dump())
    try:
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        create_audit(db, db_case.io_id or 1, "REGISTER CASE", f"Registered case dossier {db_case.fir_no} — {db_case.title}.")
        return db_case
    except Exception as e:
        db.rollback()
        raise HTTPException(400, "FIR Number already exists or invalid data provided.")


@app.get("/api/cases/{case_id}", response_model=schemas.Case)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    return case


@app.put("/api/cases/{case_id}/status")
def update_status(case_id: int, body: dict, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    case.status = body.get("status", case.status)
    db.commit()
    create_audit(db, 1, "UPDATE CASE STATUS", f"Case {case.fir_no} status → {case.status}.")
    return {"message": "Status updated"}


@app.post("/api/cases/{case_id}/seal")
def seal_case(case_id: int, body: dict, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    case.is_sealed = True
    case.status = body.get("verdict") or "Sealed (Judicial Lock)"
    db.commit()
    
    order_ref = body.get("order_ref", "N/A")
    remarks = body.get("remarks", "No remarks provided.")
    user_id = body.get("user_id", 1) # Fallback to 1 if not provided
    
    details = f"Case {case.fir_no} sealed under judicial authority.\nOrder Ref: {order_ref}\nRemarks: {remarks}"
    create_audit(db, user_id, "SEAL CASE", details)
    return {"message": "Case sealed"}


# ═══════════════════════════════════════════
#  EVIDENCE
# ═══════════════════════════════════════════

import os
from google import genai

@app.post("/api/cases/{case_id}/evidence")
def upload_evidence(case_id: int, title: str = Form(...), type: str = Form("Document"), uploaded_by: str = Form("System"), file: UploadFile = File(...), db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if case.is_sealed:
        raise HTTPException(403, "Case is sealed")

    contents = file.file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    size = f"{len(contents)/1024:.1f} KB" if len(contents) < 1048576 else f"{len(contents)/1048576:.2f} MB"

    ocr_text = "No text extracted."
    ai_analysis = "No AI analysis performed."

    # Gemini Integration
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and len(contents) > 0:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    "Extract all text perfectly from this document as if you are an OCR scanner. Then add a separator '---ANALYSIS---', and write a very brief 3-sentence legal analysis identifying any critical entities (names, banks, amounts, dates) and its relevance to a cybercrime or financial fraud investigation.",
                    {"mime_type": file.content_type or "text/plain", "data": contents}
                ]
            )
            result = response.text
            if "---ANALYSIS---" in result:
                parts = result.split("---ANALYSIS---")
                ocr_text = parts[0].strip()
                ai_analysis = parts[1].strip()
            else:
                ocr_text = result
                ai_analysis = "Analysis could not be separated from text."
        except Exception as e:
            ocr_text = f"Gemini OCR Failed: {str(e)}"
            ai_analysis = "Failed to run Gemini analysis."
    else:
        # Mocking for hackathon demo if no key or dummy file
        if "Dummy evidence content" in contents.decode('utf-8', errors='ignore'):
            ocr_text = f"[MOCK OCR SCAN]\nTitle: {title}\nDate: {datetime.utcnow().strftime('%d %b %Y')}\nDetails: Contains traces of digital asset movement and suspicious IP addresses (192.168.1.45, 10.0.0.9). Requires further cryptographic verification."
            ai_analysis = "The document explicitly references digital asset movement and IP addresses associated with known threat actors. This is highly relevant to establishing the chain of custody for the cyber fraud. Recommend immediate cross-referencing with ISP logs."
        else:
            ocr_text = contents.decode('utf-8', errors='ignore')[:1000]
            ai_analysis = "Standard document ingested. No specific legal threats automatically detected by fallback analyzer."

    ev = models.Evidence(
        case_id=case_id, 
        title=title, 
        type=type, 
        file_hash=file_hash, 
        size=size, 
        uploaded_by=uploaded_by, 
        uploaded_at=datetime.utcnow(),
        ocr_text=ocr_text,
        ai_analysis=ai_analysis
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    create_audit(db, case.io_id or 1, "UPLOAD EVIDENCE", f"Uploaded '{title}' ({size}) for {case.fir_no}. SHA-256: {file_hash[:16]}...")
    return {"id": ev.id, "title": ev.title, "file_hash": ev.file_hash, "size": ev.size, "ocr_text": ev.ocr_text, "ai_analysis": ev.ai_analysis}


@app.get("/api/cases/{case_id}/evidence")
def get_evidence(case_id: int, db: Session = Depends(get_db)):
    return db.query(models.Evidence).filter(models.Evidence.case_id == case_id).all()


from fastapi.responses import StreamingResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch

@app.get("/api/cases/{case_id}/pdf")
def generate_case_pdf(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
        
    evidence_list = db.query(models.Evidence).filter(models.Evidence.case_id == case_id).all()
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(1 * inch, height - 1 * inch, "DIGITAL EVIDENCE LOCKER - CASE REPORT")
    
    # Meta
    p.setFont("Helvetica", 12)
    p.drawString(1 * inch, height - 1.5 * inch, f"FIR No: {case.fir_no}")
    p.drawString(1 * inch, height - 1.7 * inch, f"Title: {case.title}")
    p.drawString(1 * inch, height - 1.9 * inch, f"Status: {case.status} {'(SEALED)' if case.is_sealed else ''}")
    p.drawString(1 * inch, height - 2.1 * inch, f"Jurisdiction: {case.jurisdiction}")
    p.drawString(1 * inch, height - 2.3 * inch, f"Filing Date: {case.date}")
    
    # Evidence
    p.setFont("Helvetica-Bold", 14)
    p.drawString(1 * inch, height - 2.8 * inch, "Evidence Log:")
    
    y = height - 3.2 * inch
    p.setFont("Helvetica", 10)
    for ev in evidence_list:
        if y < 1 * inch:
            p.showPage()
            y = height - 1 * inch
            p.setFont("Helvetica", 10)
            
        p.drawString(1 * inch, y, f"Title: {ev.title} ({ev.type})")
        p.drawString(1 * inch, y - 0.2 * inch, f"Hash: {ev.file_hash}")
        p.drawString(1 * inch, y - 0.4 * inch, f"Uploaded: {ev.uploaded_at.strftime('%Y-%m-%d %H:%M')}")
        y -= 0.8 * inch
        
    p.save()
    buffer.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="Case_{case.fir_no}_Report.pdf"'
    }
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

# ═══════════════════════════════════════════
#  AUDIT
# ═══════════════════════════════════════════

@app.get("/api/audit", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


# ═══════════════════════════════════════════
#  HASH VERIFICATION
# ═══════════════════════════════════════════

@app.post("/api/verify-hash")
def verify_hash(body: dict, db: Session = Depends(get_db)):
    h = body.get("hash", "")
    ev = db.query(models.Evidence).filter(models.Evidence.file_hash == h).first()
    if ev:
        return {"verified": True, "evidence_id": ev.id, "title": ev.title, "case_id": ev.case_id}
    return {"verified": False}

    return {"verified": False}

# ═══════════════════════════════════════════
#  PDF REPORT GENERATION
# ═══════════════════════════════════════════

from fpdf import FPDF
from fastapi.responses import Response

@app.get("/api/cases/{case_id}/pdf")
def generate_pdf_report(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="DIGITAL EVIDENCE LOCKER - CASE REPORT", ln=True, align='C')
    
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, txt=f"FIR Number: {case.fir_no}", ln=True)
    pdf.cell(200, 10, txt=f"Title: {case.title}", ln=True)
    pdf.cell(200, 10, txt=f"Status: {case.status} | Sealed: {'Yes' if case.is_sealed else 'No'}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt="EVIDENCE LOG", ln=True)
    
    pdf.set_font("Arial", size=10)
    for idx, ev in enumerate(case.evidences):
        pdf.ln(5)
        pdf.set_font("Arial", 'B', 10)
        pdf.cell(200, 8, txt=f"{idx+1}. {ev.title} ({ev.type})", ln=True)
        pdf.set_font("Arial", size=10)
        pdf.cell(200, 6, txt=f"   Uploaded By: {ev.uploaded_by} at {ev.uploaded_at}", ln=True)
        pdf.cell(200, 6, txt=f"   SHA-256 Hash: {ev.file_hash}", ln=True)
        
    pdf_output = pdf.output(dest='S').encode('latin1')
    return Response(content=pdf_output, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=case_{case.fir_no}_report.pdf"})

# ═══════════════════════════════════════════
#  LEGAL SECTIONS (for Register Case form)
# ═══════════════════════════════════════════

@app.get("/api/legal-sections")
def get_legal_sections():
    """Returns authentic BNS (post-2024) and IPC (pre-2024) legal sections."""
    return {
        "post_2024": [
            {"code": "BNS § 111", "title": "Organised Crime", "category": "Serious"},
            {"code": "BNS § 115(2)", "title": "Voluntarily Causing Hurt", "category": "Violence"},
            {"code": "BNS § 118(1)", "title": "Voluntarily Causing Grievous Hurt", "category": "Violence"},
            {"code": "BNS § 140", "title": "Kidnapping", "category": "Abduction"},
            {"code": "BNS § 191", "title": "Unlawful Assembly", "category": "Public Order"},
            {"code": "BNS § 303(2)", "title": "Theft", "category": "Property"},
            {"code": "BNS § 305", "title": "Theft in Dwelling House", "category": "Property"},
            {"code": "BNS § 308", "title": "Extortion", "category": "Property"},
            {"code": "BNS § 309", "title": "Robbery", "category": "Property"},
            {"code": "BNS § 316(2)", "title": "Criminal Breach of Trust", "category": "Property"},
            {"code": "BNS § 318(2)", "title": "Cheating", "category": "Property"},
            {"code": "BNS § 318(4)", "title": "Cheating & Dishonestly Inducing", "category": "Property"},
            {"code": "BNS § 329", "title": "Criminal Trespass", "category": "Property"},
            {"code": "BNS § 336", "title": "Forgery", "category": "Document"},
            {"code": "BNS § 340(2)", "title": "Forgery for Purpose of Cheating", "category": "Document"},
            {"code": "BNS § 351(2)", "title": "Criminal Intimidation", "category": "Violence"},
            {"code": "BNS § 352", "title": "Intentional Insult", "category": "Public Order"},
            {"code": "IT Act § 43", "title": "Penalty for Damage to Computer System", "category": "Cyber"},
            {"code": "IT Act § 65", "title": "Tampering with Computer Source Documents", "category": "Cyber"},
            {"code": "IT Act § 66", "title": "Computer Related Offences", "category": "Cyber"},
            {"code": "IT Act § 66B", "title": "Dishonestly Receiving Stolen Computer Resource", "category": "Cyber"},
            {"code": "IT Act § 66C", "title": "Identity Theft", "category": "Cyber"},
            {"code": "IT Act § 66D", "title": "Cheating by Personation using Computer", "category": "Cyber"},
            {"code": "IT Act § 66E", "title": "Violation of Privacy", "category": "Cyber"},
            {"code": "IT Act § 66F", "title": "Cyber Terrorism", "category": "Cyber"},
            {"code": "IT Act § 67", "title": "Publishing Obscene Material Electronically", "category": "Cyber"},
            {"code": "BSA § 63", "title": "Admissibility of Electronic Records", "category": "Evidence"},
            {"code": "BSA § 65B", "title": "Certificate for Electronic Record", "category": "Evidence"},
        ],
        "pre_2024": [
            {"code": "IPC § 120B", "title": "Criminal Conspiracy", "category": "General"},
            {"code": "IPC § 147", "title": "Rioting", "category": "Public Order"},
            {"code": "IPC § 302", "title": "Murder", "category": "Violence"},
            {"code": "IPC § 304", "title": "Culpable Homicide Not Amounting to Murder", "category": "Violence"},
            {"code": "IPC § 323", "title": "Voluntarily Causing Hurt", "category": "Violence"},
            {"code": "IPC § 354", "title": "Assault on Woman", "category": "Violence"},
            {"code": "IPC § 363", "title": "Kidnapping", "category": "Abduction"},
            {"code": "IPC § 376", "title": "Rape", "category": "Violence"},
            {"code": "IPC § 379", "title": "Theft", "category": "Property"},
            {"code": "IPC § 384", "title": "Extortion", "category": "Property"},
            {"code": "IPC § 392", "title": "Robbery", "category": "Property"},
            {"code": "IPC § 406", "title": "Criminal Breach of Trust", "category": "Property"},
            {"code": "IPC § 415", "title": "Cheating", "category": "Property"},
            {"code": "IPC § 420", "title": "Cheating & Dishonestly Inducing", "category": "Property"},
            {"code": "IPC § 441", "title": "Criminal Trespass", "category": "Property"},
            {"code": "IPC § 463", "title": "Forgery", "category": "Document"},
            {"code": "IPC § 468", "title": "Forgery for Purpose of Cheating", "category": "Document"},
            {"code": "IPC § 489A", "title": "Counterfeiting Currency Notes", "category": "Document"},
            {"code": "IPC § 498A", "title": "Cruelty by Husband or Relatives", "category": "Violence"},
            {"code": "IPC § 504", "title": "Intentional Insult", "category": "Public Order"},
            {"code": "IPC § 506", "title": "Criminal Intimidation", "category": "Violence"},
            {"code": "IPC § 509", "title": "Word/Gesture Intended to Insult Modesty", "category": "Public Order"},
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
