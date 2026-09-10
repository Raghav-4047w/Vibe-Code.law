from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    name: str
    role: str
    badge_id: str
    department: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    badge_id: str
    password: str
    role: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class EvidenceBase(BaseModel):
    title: str
    type: str
    size: str
    file_hash: str

class EvidenceCreate(EvidenceBase):
    pass

class Evidence(EvidenceBase):
    id: int
    case_id: int
    uploaded_at: datetime
    uploaded_by: str
    blockchain_tx: Optional[str] = None
    ipfs_cid: Optional[str] = None
    ocr_text: Optional[str] = None
    ai_analysis: Optional[str] = None
    class Config:
        from_attributes = True

class CaseBase(BaseModel):
    fir_no: str
    title: str
    description: str
    jurisdiction: str
    date: str

class CaseCreate(CaseBase):
    io_id: int
    legal_era: str = "post"
    sections: str = "N/A"
    status: str = "Open"

class Case(CaseBase):
    id: int
    status: str
    statute: str
    is_sealed: bool
    created_at: datetime
    io_id: int
    io: Optional[User] = None
    evidences: List[Evidence] = []
    class Config:
        from_attributes = True

class AuditLog(BaseModel):
    id: int
    timestamp: datetime
    action: str
    details: str
    blockchain_tx: Optional[str] = None
    user: Optional[User] = None
    class Config:
        from_attributes = True
