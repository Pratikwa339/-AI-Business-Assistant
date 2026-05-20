# AI-Powered Business Automation Assistant — Implementation Plan

## Current State Analysis

The existing codebase has a basic **FastAPI + React (Vite)** skeleton with significant issues:

### Critical Bugs Found
- **`main.py:67`** — References `new_lead` which is never defined; `/lead` endpoint will crash
- **`main.py:68`** — Missing `db.commit()`, `db.close()`, and return statement
- **No `/leads` GET endpoint** — Dashboard calls `GET /leads` but it doesn't exist
- **Hardcoded API key & email credentials** — Security risk (line 26 of `main.py`, line 6-7 of `automation.py`)
- **Using deprecated `google.generativeai` SDK** — Should use the newer `google-genai` SDK
- **`requirements.txt`** — Missing critical packages (fastapi, uvicorn, sqlalchemy, google-genai)
- **No error handling** anywhere in the backend
- **Email automation `send_email()`** is imported but never called

### Frontend Issues
- Basic unstyled white cards on gray background — no visual impact
- No loading states, error handling, or feedback
- Chatbot shows only the last reply, no conversation history
- Dashboard is plain text with no structure
- Uses Tailwind CSS v4 import but no actual Tailwind usage (just vanilla CSS)

---

## User Review Required

> [!IMPORTANT]
> **API Key Security**: The current code has your Gemini API key and Gmail app password hardcoded. I will move these to a `.env` file. You'll need to set these environment variables in your deployment platform as well.

> [!WARNING]
> **Email Automation**: The email notification uses Gmail SMTP with an app password. This will work but requires:
> 1. The Gmail account (`pratikpatil5439@gmail.com`) has 2FA enabled
> 2. The app password (`fdru verr mjca khub`) is still valid
> I will keep using this approach but move credentials to `.env`.

> [!IMPORTANT]
> **Deployment**: I'll configure the project for **Render** (backend) + **Vercel** (frontend) deployment. Both have free tiers. You'll need to:
> 1. Push code to GitHub
> 2. Connect repos on Render.com and Vercel.com
> 3. Set environment variables on each platform

---

## Open Questions

> [!IMPORTANT]
> **Gemini API Key**: Is the API key in `main.py` (`AIzaSyCyZXvlVcRR3ZDeD_rK7SOO8aw9CeBSTjs`) still valid and working? I'll use it via environment variable, but need to confirm it's active.

> [!IMPORTANT]
> **Email Notification Recipient**: Currently the email sends to the same sender address. Should it go elsewhere, or is self-notification correct?

---

## Proposed Changes

### Backend — Core Fixes & Enhancements

#### [MODIFY] [main.py](file:///c:/ai-business-assistant/backend/main.py)
Complete rewrite to fix all bugs and add features:
- **Fix the broken `/lead` endpoint** — create Lead object, commit to DB, close session
- **Add `GET /leads` endpoint** — return all leads as JSON for the dashboard
- **Add `GET /leads/export` endpoint** — export leads as CSV download
- **Add `DELETE /leads/{id}` endpoint** — delete a lead from the dashboard
- **Upgrade Gemini integration** — use `google-genai` SDK with `gemini-2.5-flash` model
- **Add system prompt** — configure the AI as a business assistant with context about Codenixia's courses
- **Move API key to environment variable** — use `python-dotenv`
- **Add proper error handling** with try/except and meaningful HTTP errors
- **Add conversation-aware chat** — system prompt with business context
- **Wire up email automation** — call `send_email()` on lead submission
- **Add CSV logging automation** — log every lead to `leads_log.csv`
- **Add `/stats` endpoint** — return lead count and recent activity for dashboard

#### [MODIFY] [database.py](file:///c:/ai-business-assistant/backend/database.py)
- Add proper dependency injection via `get_db()` generator function
- Keep SQLite for simplicity

#### [MODIFY] [models.py](file:///c:/ai-business-assistant/backend/models.py)
- Add `created_at` timestamp field to Lead model
- Add `status` field (new/contacted/converted)

#### [MODIFY] [automation.py](file:///c:/ai-business-assistant/backend/automation.py)
- Move email credentials to environment variables
- Add CSV logging function (`log_lead_to_csv`)
- Add error handling so email failure doesn't crash lead submission
- Add a richer HTML email template

#### [NEW] [.env](file:///c:/ai-business-assistant/backend/.env)
- `GEMINI_API_KEY` — Gemini API key
- `SMTP_EMAIL` — sender email
- `SMTP_PASSWORD` — app password
- `FRONTEND_URL` — for CORS configuration

#### [MODIFY] [requirements.txt](file:///c:/ai-business-assistant/backend/requirements.txt)
Replace with accurate dependencies:
```
fastapi==0.115.0
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
python-dotenv==1.1.0
google-genai==1.14.0
python-multipart==0.0.29
pydantic==2.11.0
```

#### [NEW] [.gitignore](file:///c:/ai-business-assistant/backend/.gitignore)
- Exclude `.env`, `__pycache__`, `.venv`, `venv`, `*.db`, `leads_log.csv`

---

### Frontend — Premium UI Overhaul

I'll drop the unused Tailwind and build a polished **dark-mode UI** with vanilla CSS, featuring glassmorphism, smooth animations, and a professional layout.

#### [MODIFY] [index.html](file:///c:/ai-business-assistant/frontend/index.html)
- Add proper `<title>`, meta description, OG tags
- Add Google Fonts (Inter)
- Add favicon

#### [MODIFY] [App.jsx](file:///c:/ai-business-assistant/frontend/src/App.jsx)
- Add **tabbed navigation** (Chat | Lead Form | Dashboard) with animated tab switching
- Add a professional header/navbar with logo
- Add a footer

#### [MODIFY] [App.css](file:///c:/ai-business-assistant/frontend/src/App.css) → Complete redesign
- **Dark mode** color scheme with deep navy/dark backgrounds
- **Glassmorphism** cards with `backdrop-filter: blur()` and semi-transparent backgrounds
- **Gradient accents** — vibrant purple-to-blue gradients for buttons and highlights
- **Smooth animations** — fade-in, slide-up on components
- **Typography** — Inter font family with proper hierarchy
- **Responsive design** — mobile-first approach
- **Micro-interactions** — hover effects, button press animations, loading spinners

#### [MODIFY] [index.css](file:///c:/ai-business-assistant/frontend/src/index.css)
- Replace Tailwind import with CSS reset and global variables (design tokens)

#### [MODIFY] [Chatbot.jsx](file:///c:/ai-business-assistant/frontend/src/components/Chatbot.jsx)
- **Chat bubble UI** — user messages on right (gradient), AI messages on left (glass card)
- **Chat history** — maintain full conversation in state
- **Loading indicator** — animated typing dots while waiting for AI response
- **Auto-scroll** — scroll to latest message
- **Error handling** — show error message if API fails
- **Markdown rendering** — render AI responses with basic formatting
- **Suggested questions** — quick-tap starter questions

#### [MODIFY] [LeadForm.jsx](file:///c:/ai-business-assistant/frontend/src/components/LeadForm.jsx)
- **Styled form fields** — floating labels, focus animations, validation indicators
- **Client-side validation** — email format, required fields, phone number
- **Success animation** — checkmark animation on submission
- **Loading state** — button spinner during submission
- **Form reset** — clear fields after successful submission

#### [MODIFY] [Dashboard.jsx](file:///c:/ai-business-assistant/frontend/src/components/Dashboard.jsx)
- **Stats cards** — total leads, new today, conversion rate (mock)
- **Data table** — sortable, with status badges and delete action
- **CSV export button** — download leads as CSV
- **Empty state** — attractive illustration when no leads exist
- **Refresh button** — manually refresh lead data
- **Status badges** — colored pills for lead status

#### [MODIFY] [api.js](file:///c:/ai-business-assistant/frontend/src/api.js)
- Make base URL configurable via environment variable for deployment
- Add response/error interceptors

#### [MODIFY] [vite.config.js](file:///c:/ai-business-assistant/frontend/vite.config.js)
- Add proxy configuration for dev mode
- Add build output configuration

---

### Deployment Configuration

#### [NEW] [render.yaml](file:///c:/ai-business-assistant/render.yaml)
- Render deployment blueprint for the backend

#### [NEW] [Procfile](file:///c:/ai-business-assistant/backend/Procfile)
- `web: uvicorn main:app --host 0.0.0.0 --port $PORT`

#### [NEW] [vercel.json](file:///c:/ai-business-assistant/frontend/vercel.json)
- Vercel deployment config with SPA routing and API rewrites

---

### Documentation

#### [NEW] [README.md](file:///c:/ai-business-assistant/README.md)
Comprehensive README covering:
- Project overview and architecture diagram (Mermaid)
- Tech stack
- Features list
- Setup instructions (local development)
- Deployment guide
- API documentation
- Screenshots
- Architecture diagram

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)        │
│                  Deployed on Vercel              │
│                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ Chatbot  │ │Lead Form │ │  Dashboard   │   │
│   │   Tab    │ │   Tab    │ │     Tab      │   │
│   └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│        │             │              │            │
└────────┼─────────────┼──────────────┼────────────┘
         │ POST /chat  │ POST /lead   │ GET /leads
         │             │ DELETE /lead  │ GET /stats
         ▼             ▼              ▼
┌─────────────────────────────────────────────────┐
│               BACKEND (FastAPI + Uvicorn)        │
│               Deployed on Render                 │
│                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ Gemini   │ │  SQLite  │ │  Automation  │   │
│   │   API    │ │    DB    │ │   Engine     │   │
│   │(2.5-flash)│ │         │ │              │   │
│   └──────────┘ └──────────┘ │ • Email SMTP │   │
│                              │ • CSV Logger │   │
│                              └──────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Verification Plan

### Automated Tests
1. **Backend health check**: `curl http://localhost:8000/` — verify JSON response
2. **Chat endpoint**: `curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message":"What courses do you offer?"}'`
3. **Lead submission**: `curl -X POST http://localhost:8000/lead -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","phone":"1234567890","message":"Interested"}'`
4. **Dashboard data**: `curl http://localhost:8000/leads` — verify lead appears
5. **Stats endpoint**: `curl http://localhost:8000/stats`
6. **Frontend build**: `cd frontend && npm run build` — verify no build errors

### Browser Testing
1. Open frontend in browser — verify premium dark UI renders
2. Test chatbot — send message, verify AI response with chat bubbles
3. Test lead form — submit with validation, verify success animation
4. Test dashboard — verify lead appears in table, test CSV export
5. Test responsive design — resize browser, verify mobile layout

### Manual Verification
- Check that email notification arrives after lead submission
- Verify `leads_log.csv` file is created and populated
- Test all error states (empty form, API failure)
