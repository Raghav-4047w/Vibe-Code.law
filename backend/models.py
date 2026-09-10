from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String) # 'OFFICER', 'JUDGE', 'ANALYST'
    badge_id = Column(String)
    department = Column(String)

    cases = relationship("Case", back_populates="io")
    audits = relationship("AuditLog", back_populates="user")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    fir_no = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text)
    status = Column(String, default="Under Investigation") # Under Investigation, Chargesheet Filed, Disposed, Sealed
    statute = Column(String)
    jurisdiction = Column(String)
    date = Column(String)
    is_sealed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    io_id = Column(Integer, ForeignKey("users.id"))
    io = relationship("User", back_populates="cases")
    
    evidences = relationship("Evidence", back_populates="case")

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    title = Column(String)
    type = Column(String)
    file_hash = Column(String) # SHA-256
    blockchain_tx = Column(String, nullable=True) # Polygon Tx Hash
    ipfs_cid = Column(String, nullable=True)
    size = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String)
    ocr_text = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)

    case = relationship("Case", back_populates="evidences")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(Text)
    blockchain_tx = Column(String, nullable=True)

    user = relationship("User", back_populates="audits")
