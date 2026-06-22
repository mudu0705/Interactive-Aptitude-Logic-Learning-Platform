# Interactive Aptitude & Logic Learning Platform

A production-ready, full-stack, AI-powered web application built as a Computer Science & Engineering Final Year Major Project.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/mudu0705/Interactive-Aptitude-Logic-Learning-Platform)

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router DOM, React Query, Axios, Zustand, Recharts, Lucide React, React Hot Toast.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM.
- **Database**: PostgreSQL (Railway PostgreSQL).
- **Authentication**: JWT, Refresh Token, Secure Password Hashing (bcrypt), OTP Email Verification Simulation.
- **AI Integrations**: Gemini API (with local smart mock fallback for Tutor Chat, Mock Interviews, ATS Analyzer, and AI Question Generation).

---

## Key Features

1. **Adaptive Difficulty Engine**: Automatically adjusts practicing difficulty (Easy ➔ Medium ➔ Hard ➔ Expert) based on streaks of 3 consecutive correct/incorrect answers.
2. **AI Tutor Assistant**: Built-in chat panel providing step-by-step solutions, formulas, and shortcut tricks contextually.
3. **AI Resume ATS Analyzer**: Checks matching keywords, highlights structural issues, checks grammar, and projects recruitment readiness probabilities.
4. **AI Mock Interview Simulator**: Realistic job interviews tailored to target companies (TCS, Capgemini, Accenture etc.) with voice input/output toggles (Web Speech API) and radar score cards.
5. **Discussion Forum**: Thread-based user portal supporting post indexing, comment logs, and user likes.
6. **QR Verified Certificates**: Validates and downloads shareable SVG credentials pointing to verification links.
7. **Admin Seeding Dashboard**: Generates new syllabus questions dynamically using Gemini.

---

## Folder Structure

```
/
├── client/                 # React 19 SPA Frontend
│   ├── src/
│   │   ├── components/     # Navigation Sidebar/Layout elements
│   │   ├── contexts/       # Global application states
│   │   ├── pages/          # App views (Dashboard, Practice, Mock Tests)
│   │   ├── services/       # Axios API client setup
│   │   ├── store/          # Zustand auth/profile sync store
│   │   ├── index.css       # Design tokens & glassmorphic templates
│   │   └── main.tsx        # React entrypoint and routing configuration
│   └── package.json
├── server/                 # Express REST API Backend
│   ├── prisma/
│   │   └── schema.prisma   # PostgreSQL prisma models
│   ├── src/
│   │   ├── controllers/    # API endpoint controllers
│   │   ├── middlewares/    # Security (rate limit, helmet), auth, and logging
│   │   ├── routes/         # Express routing definitions
│   │   ├── services/       # ATS scanner, QR cert generation, and AI services
│   │   └── index.ts        # App main entrypoint
│   └── package.json
├── shared/                 # Common Models & Types Workspace
│   └── src/
│       ├── types.ts        # Common TS types
│       └── validation.ts   # Zod validation schemas
├── railway.json            # Deployment instructions for Railway Cloud
├── package.json            # Root workspaces conductor
└── README.md               # Extensive platform documentation
```

---

## Installation & Setup Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database running locally or in the cloud.

### 2. Setting Environment Variables
Create a `.env` file inside the root directory using the template below:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aptitude_platform?schema=public"
JWT_SECRET="super-secret-jwt-key"
JWT_REFRESH_SECRET="super-secret-refresh-key"
GEMINI_API_KEY="your-gemini-api-key-here"  # Optional: Fallback mock responder is used if empty
```

### 3. Quickstart Commands
From the project root:
```bash
# 1. Install all dependencies across workspaces
npm install --legacy-peer-deps

# 2. Build the shared workspace package
npm run build:shared

# 3. Synchronize database models and seed mock syllabus questions
npm run prisma:migrate
npm run prisma:seed

# 4. Spin up concurrent development servers (Client: port 3000, Server: port 5000)
npm run dev
```

---

## API Documentation

### Authentication `/api/auth`
* `POST /register`: Registers new student. OTP verification is printed to the server terminal.
* `POST /verify-otp`: Confirms email OTP.
* `POST /login`: Validates password and returns JWT access & refresh tokens.
* `POST /refresh-token`: Signs new access token using refresh token.
* `GET /profile`: Fetches active student profile.
* `PUT /profile`: Updates onboarding college, target companies, and daily XP goals.

### Syllabus & Roadmaps `/api/topics`
* `GET /categories`: Lists core syllabus categories.
* `GET /categories/:categorySlug/topics`: Retrieves category child topics.
* `GET /topics/:slug`: Fetches topic details (Theory, Formulas, Shortcuts).
* `GET /roadmap`: Generates a personalized weekly learning roadmap.

### Practice & Performance `/api/practice`
* `POST /sessions`: Initializes practice session.
* `GET /sessions/:sessionId/questions`: Fetches questions matching session adaptive difficulty.
* `POST /sessions/:sessionId/submit`: Logs answer, recalculates stats/streaks, and upgrades/downgrades difficulty.
* `GET /analytics`: Computes accuracy rates, speed metrics, weak/strong subjects, and Recharts graph activity data.

### AI Capabilities `/api/ai`
* `POST /tutor`: Submits concept queries to AI Tutor.
* `POST /ats`: Inspects uploaded PDF resumes or pasted text against syllabus skills.
* `POST /interview/start`: Starts company-tailored AI Mock Interview sessions.
* `POST /interview/respond`: Submits user response to bot and returns next question.
* `POST /interview/end`: Concludes simulation and generates technical, communication, grammar score card.

---

## Railway Cloud Deployment Guide

This project is fully optimized for continuous, single-service deployment on Railway.

### Build and Run Pipeline
1. During deployment, Railway detects `railway.json` and runs the building scripts using Nixpacks.
2. The pipeline builds the `shared` workspace and the `client` React application.
3. The Vite compiler builds assets into `client/dist/`.
4. In production (`NODE_ENV=production`), the Node Express server hosts `/api` endpoints and serves the static files from `client/dist/` on a single Railway `PORT`, preventing CORS errors.

### Cloud Deploy Steps
1. Push your repository to GitHub.
2. Log into [Railway](https://railway.app) and create a **New Project**.
3. Link your GitHub repository.
4. Add **Railway PostgreSQL** plugin to the project. Railway automatically populates the `DATABASE_URL` environment variable.
5. Configure additional service variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `[random-hash]`
   - `JWT_REFRESH_SECRET` = `[random-hash]`
   - `GEMINI_API_KEY` = `[google-gemini-key]` (optional)
6. Railway builds and deploys automatically! View details at the service public domain.
