from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db, SessionLocal
import models
import schemas
from typing import List
from datetime import datetime
import hashlib
import bcrypt
import os
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Blockchain connector - Polygon Amoy
from blockchain_connector import log_evidence_on_chain, verify_evidence_on_chain, BLOCKCHAIN_ENABLED
print(f"[Startup] Blockchain Integration: {'ENABLED' if BLOCKCHAIN_ENABLED else 'DISABLED'}")

# NLP Engine - SpaCy + Sumy
import spacy
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None
    print("[WARN] spaCy model not found. NLP analysis will be limited.")

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-seed demo users if DB is fresh (no users exist)
try:
    from init_db import init_db
    _check_db = SessionLocal()
    _user_count = _check_db.query(models.User).count()
    _check_db.close()
    if _user_count == 0:
        print("[Startup] Fresh database detected. Seeding demo users...")
        init_db()
        print("[Startup] Demo users seeded successfully!")
    else:
        print(f"[Startup] Database has {_user_count} users. Skipping seed.")
except Exception as _seed_err:
    print(f"[Startup] Seed warning (non-fatal): {_seed_err}")

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


# In-memory OTP store: badge_id -> {otp, email, expires}
_otp_store: dict = {}

@app.post("/api/auth/send-registration-otp")
def send_registration_otp(body: dict):
    badge = body.get("badge_id", "").strip()
    email = body.get("email", "").strip()
    if not badge or not email:
        raise HTTPException(400, "Badge ID and Email are required")
    if "@" not in email or "." not in email:
        raise HTTPException(400, "Invalid email address")
    
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").strip()
    
    if not smtp_user or not smtp_pass or smtp_user == "your-real-email@gmail.com":
        raise HTTPException(500, "SMTP Credentials Missing! Please add your real Email ID and App Password in backend/.env file to send the OTP.")
        
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    
    import random, time
    otp = str(random.randint(100000, 999999))
    _otp_store[badge] = {"otp": otp, "email": email, "expires": time.time() + 600}  # 10 min expiry
    
    recipient = email
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Digital Evidence Locker <{smtp_user}>"
        msg['To'] = recipient
        msg['Subject'] = f"[DEL] Registration Verification OTP: {otp}"
        body_text = f"""
Digital Evidence Locker — Secure Registration OTP

Officer/Official: {badge}
Email: {email}
OTP: {otp}

This OTP is valid for 10 minutes. Do not share it with anyone.
If you did not request this, ignore this message.

National Judicial & Forensic Authentication Network
        """
        msg.attach(MIMEText(body_text.strip(), 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        response = {"message": "OTP dispatched", "otp_sent": True, "sent_to": recipient}
        return response
    except Exception as e:
        raise HTTPException(500, f"SMTP Error: {str(e)}")

@app.post("/api/auth/register")
def register(body: dict, db: Session = Depends(get_db)):
    import time
    badge = body.get("badge_id", "").strip()
    name = body.get("name", "").strip()
    email = body.get("email", "").strip()
    password = body.get("password", "")
    role = body.get("role", "Officer")
    otp = body.get("otp", "").strip()

    if not badge or not name or not password or not email:
        raise HTTPException(400, "All fields are required")

    # Verify OTP
    stored = _otp_store.get(badge)
    if not stored:
        raise HTTPException(400, "OTP not found. Please request a new OTP first.")
    if time.time() > stored["expires"]:
        del _otp_store[badge]
        raise HTTPException(400, "OTP has expired. Please request a new OTP.")
    if stored["otp"] != otp:
        raise HTTPException(400, "Invalid OTP. Please check your email.")
    
    # OTP verified — clear it
    del _otp_store[badge]

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
    create_audit(db, user.id, "USER REGISTERED", f"{name} ({role}) registered with ID {badge} | Email: {email}.")
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
        
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").strip()
    
    if not smtp_user or not smtp_pass or smtp_user == "your-real-email@gmail.com":
        raise HTTPException(500, "SMTP Credentials Missing! Please add your real Email ID and App Password in backend/.env file to send the OTP.")
        
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    
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

Regards,
Digital Evidence Locker System
"""
        msg.attach(MIMEText(body_text.strip(), 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        create_audit(db, user.id, "PASSWORD_RESET_REQUEST", f"OTP dispatched for {user.badge_id}.")
        return {"message": "OTP dispatched via SMTP.", "otp_sent": True}
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
    case_dict = case.model_dump()
    # Map legal_era and sections to statute
    sections = case_dict.pop("sections", "N/A")
    legal_era = case_dict.pop("legal_era", "post")
    case_dict["statute"] = f"{sections} (Era: {legal_era})"
    db_case = models.Case(**case_dict)
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

# --- AI/OCR Processing (Synchronous) ---
def process_evidence_ai(ev, file_path: str, content_type: str, db: Session):
    import json
    import re
    from ocr_engine import process_pdf, is_pdf_file
    from nlp_engine import analyze_document
    
    try:
        with open(file_path, "rb") as f:
            contents = f.read()

        extracted_text = ""
        extracted_image_hashes = []

        try:
            filename = os.path.basename(file_path)

            if is_pdf_file(filename) or "pdf" in (content_type or "").lower():
                extracted_text, saved_images = process_pdf(contents, ev.id, "uploads")
                extracted_image_hashes = saved_images
            else:
                # For non-PDF image uploads, use Gemini directly
                extracted_text = ""
                extracted_image_hashes = [filename]

            ocr_text = extracted_text.strip() if extracted_text.strip() else "[No text detected in document]"

            nlp_result = analyze_document(ocr_text, [file_path])
            raw_entities = nlp_result.get("entities", {})

            # Regex for IP, Email, Phone
            import re
            ips = list(set(re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', ocr_text)))
            emails = list(set(re.findall(r'[\w\.-]+@[\w\.-]+', ocr_text)))
            phones = list(set(re.findall(r'(?:\+91[\-\s]?)?[6-9]\d{9}', ocr_text)))
            
            keywords_list = ['fraud', 'crypto', 'wallet', 'suspect', 'transaction', 'unauthorized', 'bank', 'account', 'hack', 'phishing', 'ransom', 'dark web', 'bitcoin', 'ethereum', 'UPI']
            detected_kws = [kw for kw in keywords_list if kw.lower() in ocr_text.lower()]

            analysis_json = {
                "summary": nlp_result.get("summary", "Insufficient text for summarization."),
                "entities": {
                    "persons": raw_entities.get("PERSON", []),
                    "orgs": raw_entities.get("ORG", []),
                    "locations": raw_entities.get("GPE", []),
                    "money": raw_entities.get("MONEY", []),
                    "dates": raw_entities.get("DATE", []),
                    "ips": ips,
                    "emails": emails,
                    "phones": phones,
                    "keywords": detected_kws
                },
                "images": [img.split('.')[0] for img in extracted_image_hashes]
            }

            ev.ai_analysis = json.dumps(analysis_json)
            ev.ocr_text = nlp_result.get("full_text", ocr_text)

        except Exception as e:
            ev.ocr_text = f"[OCR/NLP Failed] Error: {str(e)}"
            ev.ai_analysis = json.dumps({"summary": f"Analysis failed: {str(e)}", "entities": {}, "images": []})

        db.commit()

        # ── Log SHA-256 hash on Polygon Amoy Blockchain ──────────────────
        try:
            bc_result = log_evidence_on_chain(ev.id, ev.file_hash)
            if bc_result.get("success"):
                ev.blockchain_tx = bc_result["tx_hash"]
                db.commit()
                print(f"[Blockchain] TX saved to DB for evidence #{ev.id}")
            else:
                print(f"[Blockchain] Could not log: {bc_result.get('error')}")
        except Exception as bc_err:
            print(f"[Blockchain] Exception during logging: {bc_err}")

    except Exception as e:
        print(f"Error in process_evidence_ai: {e}")


@app.post("/api/cases/{case_id}/evidence")
def upload_evidence(case_id: int, background_tasks: BackgroundTasks, title: str = Form(...), type: str = Form("Document"), uploaded_by: str = Form("System"), file: UploadFile = File(...), db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if case.is_sealed:
        raise HTTPException(403, "Case is sealed")

    contents = file.file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    size = f"{len(contents)/1024:.1f} KB" if len(contents) < 1048576 else f"{len(contents)/1048576:.2f} MB"

    os.makedirs("uploads", exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    file_path = f"uploads/{file_hash}{ext}"
    with open(file_path, "wb") as f:
        f.write(contents)

    import json
    initial_analysis = json.dumps({
        "summary": "AI processing in progress... Please refresh the page in a few moments.",
        "entities": {},
        "images": []
    })

    ev = models.Evidence(
        case_id=case_id, 
        title=title, 
        type=type, 
        file_hash=file_hash, 
        size=size,
        uploaded_by=uploaded_by,
        ocr_text="[OCR processing initiated...]",
        ai_analysis=initial_analysis
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Process AI - wrapped in try/except so file upload ALWAYS succeeds
    try:
        process_evidence_ai(ev, file_path, file.content_type, db)
        db.refresh(ev)
    except Exception as ai_err:
        print(f"[WARN] AI processing failed (non-fatal): {ai_err}")
        # Update with a graceful fallback message
        try:
            ev.ocr_text = f"AI processing unavailable: {str(ai_err)}"
            ev.ai_analysis = "Manual review required."
            db.commit()
            db.refresh(ev)
        except:
            pass

    create_audit(db, case.io_id or 1, "UPLOAD EVIDENCE", f"Uploaded '{title}' ({size}) for {case.fir_no}.")
    
    return {
        "id": ev.id,
        "title": ev.title,
        "file_hash": ev.file_hash,
        "size": ev.size,
        "ocr_text": ev.ocr_text,
        "ai_analysis": ev.ai_analysis,
        "blockchain_tx": ev.blockchain_tx,
        "polygonscan_url": f"https://amoy.polygonscan.com/tx/{ev.blockchain_tx}" if ev.blockchain_tx else None
    }



@app.get("/api/cases/{case_id}/evidence")
def get_evidence(case_id: int, db: Session = Depends(get_db)):
    return db.query(models.Evidence).filter(models.Evidence.case_id == case_id).order_by(models.Evidence.id.desc()).all()

@app.get("/api/blockchain/transactions")
def get_blockchain_transactions(db: Session = Depends(get_db)):
    """Fetch all EvidenceLogged events from Polygon Amoy chain (live), with DB fallback."""
    from blockchain_connector import get_evidence_events
    
    # Try live on-chain fetch first
    live_events = get_evidence_events(last_n_blocks=9999)
    
    if live_events:
        # Enrich with case/title info from DB
        for ev_event in live_events:
            db_ev = db.query(models.Evidence).filter(models.Evidence.id == ev_event["evidence_id"]).first()
            if db_ev:
                ev_event["title"] = db_ev.title
                ev_event["uploaded_at"] = db_ev.uploaded_at.isoformat() if db_ev.uploaded_at else None
                case = db.query(models.Case).filter(models.Case.id == db_ev.case_id).first()
                ev_event["fir_no"] = case.fir_no if case else "—"
        return live_events
    
    # Fallback: return DB records that have blockchain_tx
    evs = db.query(models.Evidence).filter(models.Evidence.blockchain_tx != None).order_by(models.Evidence.id.desc()).all()
    result = []
    for ev in evs:
        case = db.query(models.Case).filter(models.Case.id == ev.case_id).first()
        result.append({
            "tx_hash": ev.blockchain_tx,
            "evidence_id": ev.id,
            "file_hash": ev.file_hash,
            "logged_by": os.getenv("POLYGON_WALLET_ADDRESS", ""),
            "block_number": "—",
            "gas_used": 0,
            "gas_fee_pol": 0,
            "title": ev.title,
            "fir_no": case.fir_no if case else "—",
            "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None,
            "polygonscan_url": f"https://amoy.polygonscan.com/tx/{ev.blockchain_tx}"
        })
    return result



@app.post("/api/evidence/{evidence_id}/verify-local")
def verify_local_file(evidence_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Zero-Trust Local Verification: User uploads local file, we hash in-memory and compare."""
    import hashlib
    ev = db.query(models.Evidence).filter(models.Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(404, "Evidence metadata not found in database.")
        
    contents = file.file.read()
    recomputed_hash = hashlib.sha256(contents).hexdigest()
    disk_verified = (recomputed_hash == ev.file_hash)
    
    # Check blockchain
    chain_result = verify_evidence_on_chain(ev.id, ev.file_hash)
    
    return {
        "verified": disk_verified and chain_result.get("on_chain_match", False),
        "disk_verified": disk_verified,
        "on_chain_verified": chain_result.get("on_chain_match", False),
        "stored_hash": ev.file_hash,
        "recomputed_hash": recomputed_hash,
        "blockchain_tx": ev.blockchain_tx
    }


@app.get("/api/evidence/{evidence_id}/verify")
def verify_evidence_integrity(evidence_id: int, db: Session = Depends(get_db)):
    """Verify evidence integrity: disk re-hash + on-chain blockchain check."""
    import glob, hashlib
    ev = db.query(models.Evidence).filter(models.Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(404, "Evidence not found")

    # ── Step 1: Disk re-hash ──────────────────────────────────────────────
    files = glob.glob(f"uploads/{ev.file_hash}.*")
    disk_verified = False
    recomputed_hash = None
    if files:
        with open(files[0], "rb") as f:
            recomputed_hash = hashlib.sha256(f.read()).hexdigest()
        disk_verified = (recomputed_hash == ev.file_hash)
    else:
        disk_verified = False

    # ── Step 2: Blockchain on-chain check ────────────────────────────────
    chain_result = verify_evidence_on_chain(ev.id, ev.file_hash)

    return {
        "verified": disk_verified and chain_result.get("on_chain_match", False),
        "disk_verified": disk_verified,
        "on_chain_verified": chain_result.get("on_chain_match", False),
        "blockchain_enabled": BLOCKCHAIN_ENABLED,
        "stored_hash": ev.file_hash,
        "recomputed_hash": recomputed_hash,
        "blockchain_tx": ev.blockchain_tx,
        "polygonscan_url": f"https://amoy.polygonscan.com/tx/{ev.blockchain_tx}" if ev.blockchain_tx else None,
        "evidence_id": ev.id,
        "title": ev.title
    }



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

@app.get("/api/files/{file_hash}")
def download_file(file_hash: str):
    import os
    import glob
    from fastapi.responses import FileResponse
    files = glob.glob(f"uploads/{file_hash}.*")
    if files:
        return FileResponse(files[0])
    raise HTTPException(404, "File not found locally")

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
            {"code": "BNS § 64", "title": "Rape", "category": "Violence"},
            {"code": "BNS § 65", "title": "Rape under age of 16 years", "category": "Violence"},
            {"code": "BNS § 69", "title": "Sexual Intercourse by deceitful means", "category": "Violence"},
            {"code": "BNS § 74", "title": "Assault to Outrage Modesty", "category": "Violence"},
            {"code": "BNS § 103", "title": "Murder", "category": "Violence"},
            {"code": "BNS § 105", "title": "Culpable Homicide Not Amounting to Murder", "category": "Violence"},
            {"code": "BNS § 109", "title": "Attempt to Murder", "category": "Violence"},
            {"code": "BNS § 111", "title": "Organised Crime", "category": "Serious"},
            {"code": "BNS § 112", "title": "Petty Organised Crime", "category": "Serious"},
            {"code": "BNS § 113", "title": "Terrorist Act", "category": "Serious"},
            {"code": "BNS § 115(2)", "title": "Voluntarily Causing Hurt", "category": "Violence"},
            {"code": "BNS § 118(1)", "title": "Voluntarily Causing Grievous Hurt", "category": "Violence"},
            {"code": "BNS § 137", "title": "Kidnapping", "category": "Abduction"},
            {"code": "BNS § 138", "title": "Abduction", "category": "Abduction"},
            {"code": "BNS § 140", "title": "Kidnapping or Abducting for Murder", "category": "Abduction"},
            {"code": "BNS § 150", "title": "Acts endangering sovereignty, unity and integrity of India", "category": "Serious"},
            {"code": "BNS § 191", "title": "Unlawful Assembly", "category": "Public Order"},
            {"code": "BNS § 193", "title": "Rioting", "category": "Public Order"},
            {"code": "BNS § 200", "title": "Affray", "category": "Public Order"},
            {"code": "BNS § 203", "title": "Coining False Currency", "category": "Counterfeit"},
            {"code": "BNS § 302", "title": "Snatching", "category": "Property"},
            {"code": "BNS § 303(2)", "title": "Theft", "category": "Property"},
            {"code": "BNS § 305", "title": "Theft in Dwelling House", "category": "Property"},
            {"code": "BNS § 308", "title": "Extortion", "category": "Property"},
            {"code": "BNS § 309", "title": "Robbery", "category": "Property"},
            {"code": "BNS § 310", "title": "Dacoity", "category": "Property"},
            {"code": "BNS § 314", "title": "Criminal Breach of Trust", "category": "Property"},
            {"code": "BNS § 316", "title": "Cheating", "category": "Property"},
            {"code": "BNS § 318(4)", "title": "Cheating & Dishonestly Inducing", "category": "Property"},
            {"code": "BNS § 329", "title": "Criminal Trespass", "category": "Property"},
            {"code": "BNS § 336", "title": "Forgery", "category": "Document"},
            {"code": "BNS § 340(2)", "title": "Forgery for Purpose of Cheating", "category": "Document"},
            {"code": "BNS § 351(2)", "title": "Criminal Intimidation", "category": "Violence"},
            {"code": "IT Act § 43", "title": "Penalty for Damage to Computer System", "category": "Cyber"},
            {"code": "IT Act § 65", "title": "Tampering with Computer Source Documents", "category": "Cyber"},
            {"code": "IT Act § 66", "title": "Computer Related Offences", "category": "Cyber"},
            {"code": "IT Act § 66C", "title": "Identity Theft", "category": "Cyber"},
            {"code": "IT Act § 66D", "title": "Cheating by Personation using Computer", "category": "Cyber"},
            {"code": "IT Act § 66E", "title": "Violation of Privacy", "category": "Cyber"},
            {"code": "IT Act § 66F", "title": "Cyber Terrorism", "category": "Cyber"},
            {"code": "BSA § 63", "title": "Admissibility of Electronic Records", "category": "Evidence"},
            {"code": "BSA § 65B", "title": "Certificate for Electronic Record", "category": "Evidence"},
        ],
        "pre_2024": [
            {"code": "IPC § 120B", "title": "Criminal Conspiracy", "category": "General"},
            {"code": "IPC § 121", "title": "Waging War against Government", "category": "Serious"},
            {"code": "IPC § 124A", "title": "Sedition", "category": "Serious"},
            {"code": "IPC § 147", "title": "Rioting", "category": "Public Order"},
            {"code": "IPC § 159", "title": "Affray", "category": "Public Order"},
            {"code": "IPC § 231", "title": "Counterfeiting Coin", "category": "Counterfeit"},
            {"code": "IPC § 295A", "title": "Outraging Religious Feelings", "category": "Public Order"},
            {"code": "IPC § 302", "title": "Murder", "category": "Violence"},
            {"code": "IPC § 304", "title": "Culpable Homicide Not Amounting to Murder", "category": "Violence"},
            {"code": "IPC § 304B", "title": "Dowry Death", "category": "Violence"},
            {"code": "IPC § 307", "title": "Attempt to Murder", "category": "Violence"},
            {"code": "IPC § 323", "title": "Voluntarily Causing Hurt", "category": "Violence"},
            {"code": "IPC § 326", "title": "Grievous Hurt by Dangerous Weapons", "category": "Violence"},
            {"code": "IPC § 354", "title": "Assault on Woman", "category": "Violence"},
            {"code": "IPC § 354D", "title": "Stalking", "category": "Violence"},
            {"code": "IPC § 363", "title": "Kidnapping", "category": "Abduction"},
            {"code": "IPC § 376", "title": "Rape", "category": "Violence"},
            {"code": "IPC § 379", "title": "Theft", "category": "Property"},
            {"code": "IPC § 384", "title": "Extortion", "category": "Property"},
            {"code": "IPC § 392", "title": "Robbery", "category": "Property"},
            {"code": "IPC § 395", "title": "Dacoity", "category": "Property"},
            {"code": "IPC § 406", "title": "Criminal Breach of Trust", "category": "Property"},
            {"code": "IPC § 409", "title": "Criminal breach of trust by public servant/banker", "category": "Property"},
            {"code": "IPC § 411", "title": "Dishonestly Receiving Stolen Property", "category": "Property"},
            {"code": "IPC § 420", "title": "Cheating and dishonestly inducing delivery of property", "category": "Property"},
            {"code": "IPC § 465", "title": "Forgery", "category": "Document"},
            {"code": "IPC § 468", "title": "Forgery for Purpose of Cheating", "category": "Document"},
            {"code": "IPC § 471", "title": "Using as genuine a forged document", "category": "Document"},
            {"code": "IPC § 489B", "title": "Using as genuine, forged or counterfeit currency", "category": "Counterfeit"},
            {"code": "IPC § 498A", "title": "Cruelty by Husband or Relatives", "category": "Violence"},
            {"code": "IPC § 506", "title": "Criminal Intimidation", "category": "Violence"},
            {"code": "IPC § 509", "title": "Word, gesture or act intended to insult modesty", "category": "Violence"},
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
