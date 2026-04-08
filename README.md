# Speak Sense AI

Speak Sense AI is an AI-powered interview preparation platform with immersive 3D interviewers, real-time communication coaching, and market-aware career guidance.

The platform combines:
- Past-skill analysis from user profile data
- Future market trend signals by role/domain
- Real-world mock interview simulations
- Feedback loops for speaking, posture, and answer quality

## What Is New

This update introduces a full motion and AI copilot layer across the app, plus stronger interview realism.

### 1) Cross-page animation effects
- Route-level reveal animations for major page containers
- Smooth entry motion for dashboard, planning, interview, practice, and auth surfaces
- Reduced-motion accessibility support

### 2) Real-world AI Interview Copilot overlay (all pages)
- Floating Interview Copilot dock available throughout the app
- Dynamic market demand and salary range snapshot
- Skill-match readiness score
- Next-action recommendations tied to role and trend data

### 3) 3D interview realism improvements
- Existing 3D avatar flow kept as core interview mode
- Added market-aware interview prep intelligence directly in interview sidebar
- Future Market Coach card uses past skills + target role + difficulty to personalize coaching

### 4) 10 newly surfaced platform features
The app now exposes these as a unified capability set:
1. 3D motion interviewer avatars
2. Skill-to-market gap analysis
3. Adaptive question difficulty
4. Live speech and filler-word coach
5. Posture and eye-contact monitor
6. Role-specific interview playbooks
7. Future demand trend radar
8. Compensation range intelligence
9. Weekly preparation sprints
10. Job readiness scoring dashboard

## Tech Stack

### Frontend
- React
- React Router
- Framer Motion
- CSS modules / page styles
- Three.js-based interview scene components

### Backend
- Node.js + Express API
- Mongo models for users and interview sessions

### AI Service
- Python service for AI-powered interview processing

## Project Structure

- client: React frontend
- server: Node/Express backend
- ai-service: Python AI service

## Quick Start

## 1. Install dependencies

From repository root:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Install Python dependencies:

```bash
pip install -r ai-service/requirements.txt
```

## 2. Start all services with Docker (optional)

```bash
docker-compose up --build
```

## 3. Run locally without Docker

Terminal 1:

```bash
npm --prefix server run dev
```

Terminal 2:

```bash
python ai-service/main.py
```

Terminal 3:

```bash
npm --prefix client start
```

## Main User Flow

1. Configure interview in Planning
2. Select AI interviewer avatar
3. Run interview in 3D mode (or 2D fallback)
4. Receive real-time voice and posture coaching
5. Review market-aware future-skill guidance
6. Finish session and inspect detailed analytics in Results

## New Components Added

- client/src/components/PageExperienceLayer.jsx
- client/src/components/PageExperienceLayer.css
- client/src/utils/marketIntelligence.js

## Updated Files

- client/src/App.jsx
- client/src/pages/Interview.jsx
- client/src/pages/interview.css

## Accessibility Notes

- Reduced-motion support is preserved through media query handling
- Overlay components are keyboard accessible and use ARIA labels where needed

## Future Extensions

- Connect market intelligence to live external labor-market APIs
- Persist user skill progression and trend readiness history
- Add role-based benchmark scorecards over time
