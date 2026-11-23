# HireSmart AI

> **Find the right candidate in seconds, not weeks.**

**HireSmart AI** is an AI-powered Applicant Tracking System (ATS) and recruitment intelligence platform built with React, TypeScript, Express, Firebase (Auth & Firestore), and the Google Gemini API. It helps hiring teams create job requisitions, parse resumes, rank applicants with explainable weighted scoring, detect resume anomalies, conduct structured interviews, estimate compensation, and manage end-to-end hiring pipelines.

---

## Key Features

### Authentication & Workspace Modes
- **Login with Google** (Firebase Authentication + persistent Cloud Firestore workspace)
- **Continue as Guest** (instant local exploration preloaded with the **TechNova Solutions** demo dataset)
- **TechNova Solutions Demo Dataset**: Includes **15 Jobs**, **100 Candidates**, **50 Interviews**, **20 Shortlisted Candidates**, **8 Hired Candidates**, and **25 Interview Scorecards**. Authenticated Google users can also load the full TechNova demo dataset from **Settings**.

### Core ATS & Enterprise AI Modules
1. **Dashboard & AI Hiring Health**:
   - Live KPIs: Total Jobs, Active Jobs, Applications, Shortlisted, Interviews Scheduled, Offers Sent, and Hired Candidates.
   - **AI Hiring Health Dashboard**: Average Time to Hire, Interview Success Rate, Offer Acceptance Rate, Most Applied Jobs, Top Skills in Demand, and Recruitment Bottlenecks.
   - Charts & feeds: Applications Per Job, Monthly Hiring Trend, Hiring Funnel, Skill Demand Analysis, Recent Activities, Quick Actions, and Notifications.
2. **Job Management & AI JD Generator**:
   - Create, edit, duplicate, publish, pause, close, and delete requisitions.
   - Generate structured job descriptions, responsibilities, benefits, required/preferred skills, qualifications, and salary ranges from a role title via Gemini.
   - **Job Performance Analytics** on each job card (Applied, Shortlisted, Interviews, Offers, Hiring Success %).
3. **Candidates & Enterprise AI Profile Drawer**:
   - **Candidate Favorites**: Star, Priority, Watchlist, and Talent Pool flags with a Quick Access Panel and top-bar Favorites menu.
   - **Smart Search Engine**: Natural-language filtering (e.g., `"Find React developers with AWS"`, `"3+ years experience"`, `"Mumbai with NodeJS"`).
   - **4-Candidate Comparison Center**: Compare up to 4 candidates side by side across Match Score, Interview Score, Experience, Education, Skills, Projects, and Certifications.
   - **Duplicate Candidate Detector**: Flags matching emails, phone numbers, identical resume signatures, and duplicate job applications.
   - **AI Candidate Insights**: Readiness Score, Strengths, Weaknesses, Technical & Experience Summaries, and Hiring Recommendation.
   - **Smart Match Explanation**: Explainable sub-scores (Skill Match, Experience Match, Education Match, Project Match).
   - **Predictive Hiring Success**: Success probability %, Risk Prediction (`Low` / `Medium` / `High`), recommendation, and key drivers.
   - **Resume Fraud Detection**: Flags skill exaggeration, duplicate companies, inconsistent dates, overlapping experiences, and missing employment details with authenticity confidence scores.
   - **Candidate Activity Timeline**: Chronological journey from Resume Uploaded through Screened, Shortlisted, Interview, Offer Sent, and Hired/Rejected.
   - **AI Salary Estimator & Resume Optimization**: Compensation estimation from skills, experience, location, and education plus actionable resume improvement tips.
4. **Applications Pipeline (8-Stage Kanban)**:
   - Drag-and-drop and stage-selector transitions across `Applied → Screening → Shortlisted → Interview → Selected → Offer Sent → Hired → Rejected`.
   - **AI Rejection Reasons**: Suggests and records structured rejection feedback when moving candidates to `Rejected`.
5. **AI Resume Parser**:
   - Upload **PDF**, **DOCX** (`mammoth`), **TXT**, or paste raw resume text to extract structured contact details, skills, experience, projects, education, certifications, and resume quality scores.
6. **AI Recommendations & Skill Gap Analyzer**:
   - Weighted matching engine (**40% Skills**, **20% Experience**, **15% Projects**, **15% Education**, **10% Certifications**) with missing-skill course recommendations.
7. **Interview Center**:
   - Schedule online/offline interviews, generate role- and difficulty-tailored AI interview questions, and submit **6-dimension Interview Scorecards** (**Technical Skills**, **Communication**, **Problem Solving**, **Leadership**, **Teamwork**, **Culture Fit**) with AI interview summaries.
8. **Talent Pool & Candidate Leaderboard**:
   - Reusable **Talent Pool** for searching past applicants and re-shortlisting them into new roles.
   - **Leaderboard** ranked across Highest Match Score, Most Experienced, Most Certifications, Highest Interview Rating, and Top Recommended Candidate.
9. **Global Recruitment Copilot & Voice Assistant**:
   - Accessible across every page via floating widget with text and Web Speech API voice commands (e.g., `"Show React candidates"`, `"Schedule interview with Rahul Sharma"`, `"Open shortlisted applicants"`, `"Create a new job posting"`).
10. **Reports, Analytics & Settings**:
    - Export real **PDF** (`jspdf`), **Excel** (`xlsx`), and **CSV** reports for Candidate, Hiring, Interview, and Analytics datasets.
    - Configurable auto-shortlist threshold, organization name, notifications, and dark/light theme.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, `tsx`, `mammoth` (DOCX text extraction)
- **AI Engine**: Google Gemini API via `@google/genai` (`gemini-4-hydrogen`)
- **Persistence & Auth**: Firebase Authentication (Google Sign-In) & Cloud Firestore
- **Exports**: `jspdf` (PDF), `xlsx` (Excel)

---

## Project Structure

```text
├── server.ts                          # Express server, Vite dev middleware, and /api/ai/* Gemini endpoints
├── index.html                         # App HTML entry point & fonts
├── metadata.json                      # Application metadata & capabilities
├── firebase-applet-config.json        # Firebase project & Firestore database configuration
├── firebase-blueprint.json            # Firestore data schema blueprint
├── firestore.rules                    # Firestore security rules (owner-scoped RBAC)
├── src/
│   ├── App.tsx                        # Workspace shell & module routing
│   ├── types.ts                       # TypeScript interfaces for ATS entities & AI responses
│   ├── context/ATSContext.tsx         # Auth, Firestore real-time listeners, guest demo state & CRUD
│   ├── data/demoData.ts               # TechNova Solutions demo generator (15 jobs, 100 candidates)
│   ├── lib/
│   │   ├── firebase.ts                # Firebase SDK initialization & error handling
│   │   └── matchingEngine.ts          # Weighted scoring, fraud checks, salary, search & export helpers
│   └── components/                    # Modular ATS views & GlobalCopilot
└── package.json
```

---

## Server-Side AI Endpoints

All Gemini API requests are proxied server-side through Express in `server.ts`:

- `GET /api/health` — Service health check
- `POST /api/ai/job-description` — Generate job descriptions, skills, responsibilities, and salary ranges
- `POST /api/ai/parse-resume` — Parse PDF, DOCX, or raw resume text into structured candidate JSON
- `POST /api/ai/match-candidate` — AI-assisted candidate-to-job evaluation
- `POST /api/ai/interview-questions` — Role- and candidate-specific technical/behavioral questions
- `POST /api/ai/interview-summary` — Synthesize scorecard ratings and notes into hiring verdicts
- `POST /api/ai/email-draft` — Generate personalized recruitment email drafts
- `POST /api/ai/assistant` — Conversational ATS data assistant
- `POST /api/ai/candidate-insights` — Readiness score, strengths, weaknesses, and recommendation
- `POST /api/ai/resume-fraud` — AI resume authenticity and inconsistency audit
- `POST /api/ai/salary-estimator` — Market compensation range estimation
- `POST /api/ai/predictive-success` — Hiring success probability and risk level
- `POST /api/ai/smart-search` — Natural-language candidate query interpretation
- `POST /api/ai/rejection-reason` — Objective rejection category and feedback reason
- `POST /api/ai/copilot` — Global copilot and voice command intent router

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Google Gemini API key (`GEMINI_API_KEY`)

### Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and set your secrets:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `GEMINI_API_KEY` — Google Gemini API key (used exclusively server-side in `server.ts`)
   - `APP_URL` — Application base URL

3. **Run the development server** (runs Express + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```

4. **Typecheck & build for production**:
   ```bash
   npm run lint
   npm run build
   ```

5. **Start the production server**:
   ```bash
   npm start
   ```
