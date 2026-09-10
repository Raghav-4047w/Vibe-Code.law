from database import SessionLocal, engine, Base
import models
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt directly to avoid passlib version issues."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(models.AuditLog).delete()
    db.query(models.Evidence).delete()
    db.query(models.Case).delete()
    db.query(models.User).delete()
    db.commit()

    # Create Users with direct bcrypt hashing
    hashed = hash_password("password")

    u1 = models.User(
        username="vikram",
        hashed_password=hashed,
        name="Insp. Vikram Rathore",
        role="Officer",
        badge_id="DL-POL-2024-8842",
        department="Cyber Crime Unit",
    )
    u2 = models.User(
        username="anita",
        hashed_password=hashed,
        name="Analyst Anita Roy",
        role="Analyst",
        badge_id="DEL-FSL-09",
        department="CFSL",
    )
    u3 = models.User(
        username="pkverma",
        hashed_password=hashed,
        name="Hon'ble P. K. Verma",
        role="Judge",
        badge_id="DL-CT-N001",
        department="Sessions Court",
    )

    db.add_all([u1, u2, u3])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)
    db.refresh(u3)

    # Create sample cases
    c1 = models.Case(
        fir_no="FIR-2026-014",
        title="State vs. Unknown Syndicate (Ransomware Extortion on Healthcare Network)",
        description="System intrusion affecting Apollo AI medical telemetry nodes. Seized encrypted memory captures, egress Wireshark PCAPs, and forensic mirror dumps.",
        status="Under Investigation",
        statute="Sec 111(2) BNS & Sec 66 IT",
        jurisdiction="Cyber Cell, New Delhi",
        date="12 Feb 2026",
        io_id=u1.id,
    )
    c2 = models.Case(
        fir_no="FIR-2025-992",
        title="State vs. Rajesh Mehta & Ors. (Cryptocurrency Ponzi Diversion)",
        description="Multi-crore digital wallet dissipation. Seized 3 cold storage ledgers, phone extractions (UFED Cellebrite), and AWS database forensic images.",
        status="Chargesheet Filed",
        statute="Sec 318(2) BNS & Sec 63 BSA",
        jurisdiction="Special Court (EOW), New Delhi",
        date="28 Jan 2026",
        io_id=u1.id,
    )
    db.add_all([c1, c2])
    db.commit()

    # Create audit logs
    a1 = models.AuditLog(user_id=u1.id, action="REGISTER CASE", details=f"Registered case dossier {c1.fir_no} — {c1.title}.")
    a2 = models.AuditLog(user_id=u2.id, action="UPLOAD EVIDENCE", details=f"Uploaded 3 disk mirror dumps for {c1.fir_no} with SHA-256 genesis hash.")
    a3 = models.AuditLog(user_id=u1.id, action="REGISTER CASE", details=f"Registered case dossier {c2.fir_no} — {c2.title}.")
    db.add_all([a1, a2, a3])
    db.commit()

    print(f"Database seeded successfully!")
    print(f"  Users: {u1.badge_id} / {u2.badge_id} / {u3.badge_id}")
    print(f"  Password for all: password")
    print(f"  Cases: {c1.fir_no}, {c2.fir_no}")
    db.close()

if __name__ == "__main__":
    init_db()
