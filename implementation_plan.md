# Backend & Database Architecture Plan (Phase 2)

We are transitioning from the static mock UI to a fully functional application with a real database and API.

## Goal
Implement a robust backend using Python (FastAPI), a unified relational database, and re-integrate the Polygon Amoy blockchain. Connect the Next.js frontend to this backend, removing all hardcoded UI mock data.

## Open Questions
- **Database Choice:** For the hackathon, **SQLite** is highly recommended as it requires zero setup, is a single file, and works flawlessly with Python's SQLAlchemy. If you prefer **PostgreSQL**, you would need to install it on your Windows machine. I recommend SQLite for smooth demos. Is SQLite acceptable?

## Proposed Changes

### 1. Database & RBAC (Role-Based Access Control)
*User Request: "3 alag DB lagaye as per Role RBAC types vrna as per your wish and industry standards"*
**Industry Standard Solution:** Creating 3 physically separate databases makes joining data (like seeing which Officer uploaded to which Case) extremely slow and error-prone. The standard approach is a **Single Relational Database** with strict **Role-Based Access Control (RBAC)** at the API layer.
- **Users Table:** Contains all users with a `role` column (`OFFICER`, `JUDGE`, `ANALYST`).
- **Authentication:** JWT (JSON Web Tokens) will encode the user's role.
- **API Protection:** FastAPI endpoints will verify the role before executing logic (e.g., only a `JUDGE` can call the `/api/cases/{id}/seal` endpoint).

### 2. Backend Components (Python FastAPI)
#### [NEW] `backend/main.py`
The FastAPI application entry point, configuring CORS and routing.
#### [NEW] `backend/database.py`
SQLAlchemy setup for the database connection.
#### [NEW] `backend/models.py`
- `User`: Handles logins for Officer, Analyst, Judge.
- `CaseDossier`: Stores FIR details, status, IO assignment.
- `Evidence`: Stores uploaded artifacts, hashes, and IPFS/local links.
- `AuditLog`: Stores every action for the immutable trail.
#### [NEW] `backend/routes/auth.py`, `cases.py`, `evidence.py`, `audit.py`
Endpoints to serve the frontend.
#### [NEW] `backend/blockchain.py`
Integration with `web3.py` to push hashes and logs to the Amoy testnet using the preserved `WALLET_BACKUP.txt`.

### 3. Frontend Integration (Next.js)
#### [MODIFY] `frontend/src/app/(auth)/login/page.tsx`
Remove dummy login. Add actual API call to `/api/auth/login` to receive JWT.
#### [MODIFY] `frontend/src/app/(app)/page.tsx` (Dashboard)
Remove `MOCK_CASES`. Add React `useEffect` or SWR to fetch real cases from `/api/cases`.
#### [MODIFY] `frontend/src/app/(app)/case/[id]/page.tsx` (Dossier)
Fetch specific case details and evidences. Handle role-based UI natively based on logged-in user.
#### [MODIFY] `frontend/src/app/(app)/audit/page.tsx` (Audit Trail)
Fetch real audit logs from the database/blockchain.
#### [MODIFY] `frontend/src/app/(app)/case/new/page.tsx` (Register Case)
Send form data to `POST /api/cases`.

## Verification Plan
### Automated Tests
- Run Python backend locally (`uvicorn main:app --reload`).
- Verify endpoints via Swagger UI (`http://localhost:8000/docs`).
### Manual Verification
- Register a new case in the UI and verify it appears in the Dashboard and SQLite DB.
- Login as a Judge and seal the case.
- Verify Blockchain transactions on Polygonscan.
