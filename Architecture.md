# AI Interviewer Architecture & Development Plan

## 1) Executive Summary

This system is designed as a loosely coupled, production-ready AI Interviewer platform with strict module boundaries so multiple teams can work independently.

### Core goals
- Ask adaptive interview questions in real time
- Accept text and voice answers
- Evaluate answers and generate feedback/scoring
- Persist interview sessions and history
- Support multiple interview domains: technical, HR, leadership, role-specific, etc.
- Keep frontend, backend, AI, and database responsibilities separated

### Recommended approach
- **Frontend:** React + TypeScript
- **Authentication:** Firebase Auth
- **Primary API layer:** Node.js + TypeScript + NestJS (or Fastify if you want a lighter stack)
- **AI/LLM service:** Python + FastAPI for orchestration, scoring, and voice pipeline
- **Database:** PostgreSQL
- **Async jobs / queue:** Redis + BullMQ or Cloud Tasks equivalent
- **Voice processing:** Web Speech API for MVP, server-side STT/TTS optional later

---

## 2) High-Level System Architecture

```text
┌──────────────────────────────┐
│          React Web UI         │
│  - Candidate UI               │
│  - Interviewer dashboard      │
│  - Admin/config screens       │
└──────────────┬───────────────┘
			   │ HTTPS / WebSocket
			   v
┌──────────────────────────────┐        ┌──────────────────────────────┐
│      Backend API Layer        │<------>│      Firebase Auth            │
│  (NestJS / Fastify)           │        │  - Identity                   │
│  - session CRUD               │        │  - JWT issuance               │
│  - candidate/session auth     │        └──────────────────────────────┘
│  - interview orchestration    │
│  - history + reporting        │
└───────┬─────────────┬─────────┘
		│             │
		│             └───────────────┐
		│                             │
		v                             v
┌──────────────────────┐     ┌─────────────────────────────┐
│  PostgreSQL           │     │  AI / LLM Service Layer     │
│  - users              │     │  (FastAPI)                  │
│  - interview sessions │     │  - question generation      │
│  - responses          │     │  - answer evaluation        │
│  - scores             │     │  - feedback synthesis       │
│  - rubrics            │     │  - voice transcription hook │
└──────────────────────┘     └──────────────┬──────────────┘
											 │
											 v
								   ┌──────────────────────┐
								   │  LLM Provider(s)      │
								   │  - OpenAI / Anthropic │
								   │  - embeddings model   │
								   └──────────────────────┘

Optional async path:
API -> Queue (Redis/BullMQ) -> Worker -> AI Service -> DB update
```

### Why this shape works
- The frontend never talks directly to the database or LLM provider.
- The backend API owns business rules and security.
- The AI service owns prompt logic, scoring heuristics, and provider abstraction.
- PostgreSQL remains the system of record.
- Voice processing can evolve without rewriting the core interview flow.

---

## 3) End-to-End Data Flow

### A. User sign-in
1. Candidate or interviewer signs in with Firebase Auth.
2. Firebase returns an ID token.
3. React sends token to backend API.
4. Backend verifies token using Firebase Admin SDK.
5. Backend maps Firebase identity to internal `users` row in PostgreSQL.

### B. Create interview session
1. Interviewer selects role/domain/template.
2. React calls backend `POST /interviews`.
3. Backend creates interview session record and initializes rubric/template.
4. Backend requests first question from AI service or retrieves from template bank.
5. Session is returned to the UI.

### C. Candidate answers a question
1. Candidate submits text answer or voice recording.
2. For voice, frontend uploads audio to backend or object storage.
3. Backend stores response metadata and queues evaluation.
4. AI service receives question + answer + rubric + interview context.
5. AI service returns structured scoring, strengths, weaknesses, follow-up recommendation.
6. Backend stores result in PostgreSQL.

### D. Adaptive questioning
1. Backend sends evaluation summary and context to AI service.
2. AI service suggests next question based on skill gaps, confidence, and interview stage.
3. Backend stores the next question and exposes it to the frontend.

### E. Completion and feedback
1. Interview ends after target questions/time.
2. Backend aggregates all responses and scores.
3. AI service generates overall summary and candidate feedback.
4. Backend persists final interview report and exposes it in history/dashboard.

---

## 4) Module Breakdown

## 4.1 Frontend Module — React Web App

### Responsibilities
- Candidate interview UI
- Interviewer/admin dashboard
- Authentication state management
- Question rendering, answer capture, voice recording UI
- Session progress, timers, score display
- Interview history view
- Error handling and loading states

### Recommended stack
- React + TypeScript
- Vite
- React Router
- TanStack Query for server state
- Zustand for lightweight local app state
- MUI or shadcn/ui for consistent component system
- Firebase Web SDK for auth
- Web Speech API or MediaRecorder API for MVP voice capture

### Folder structure
```text
src/
  app/
	routes/
	providers/
	layout/
  features/
	auth/
	interview/
	history/
	dashboard/
	voice/
  components/
  services/
	apiClient.ts
	firebase.ts
  hooks/
  store/
  types/
  utils/
```

### APIs consumed
- `POST /auth/session`
- `GET /interviews`
- `POST /interviews`
- `GET /interviews/:id`
- `POST /interviews/:id/responses`
- `POST /interviews/:id/complete`
- `GET /history`

### Must not handle
- Scoring logic
- LLM prompts
- Database writes directly
- Business rule enforcement
- Firebase token verification

---

## 4.2 Backend API Layer — Application Core

### Responsibilities
- Verify Firebase tokens
- Expose REST APIs for frontend
- Own business rules and session state transitions
- Persist and query PostgreSQL data
- Coordinate calls to AI service
- Enforce RBAC/authorization
- Manage async jobs, retries, and idempotency
- Aggregate interview results

### Recommended stack
- Node.js + TypeScript
- NestJS for modular architecture and dependency injection
- Prisma ORM
- PostgreSQL
- Redis + BullMQ for background jobs
- Zod or class-validator for request validation
- OpenAPI/Swagger for API contracts

### Folder structure
```text
src/
  modules/
	auth/
	users/
	interviews/
	responses/
	scoring/
	reports/
	templates/
	domains/
	notifications/
  common/
	guards/
	interceptors/
	filters/
	pipes/
	constants/
  prisma/
  config/
  jobs/
  integrations/
	firebase/
	ai-service/
	storage/
```

### APIs exposed
- Public REST endpoints for frontend
- Internal endpoints for worker/AI coordination if required
- Webhook endpoints if using external storage or STT/TTS providers

### Must not handle
- Prompt design details
- LLM vendor-specific logic
- Audio transcription internals
- UI concerns
- Direct Firebase client operations from browser-side business logic

---

## 4.3 AI / LLM Service Layer

### Responsibilities
- Generate interview questions
- Score candidate answers against rubric
- Produce structured feedback and summaries
- Support interview adaptation logic
- Optionally orchestrate voice transcription and TTS requests
- Provide provider abstraction and fallback handling

### Recommended stack
- Python + FastAPI
- Pydantic for typed contracts
- LLM SDK abstraction layer
- Optional LangGraph or lightweight custom orchestration
- Optional embedding model for similarity/rubric retrieval

### Folder structure
```text
app/
  routers/
  services/
	llm/
	scoring/
	prompts/
	rubric/
	voice/
  schemas/
  clients/
  core/
  tests/
```

### APIs exposed
- `POST /ai/generate-question`
- `POST /ai/evaluate-answer`
- `POST /ai/summarize-interview`
- `POST /ai/create-rubric`
- `POST /ai/transcribe-audio` (optional)

### Must not handle
- Authentication/session management
- Direct frontend rendering logic
- Source of truth persistence beyond result artifacts
- Admin screens and user management

---

## 4.4 Authentication Module — Firebase

### Responsibilities
- User sign-up/sign-in
- Social login if needed
- Password reset, email verification, MFA support
- Issue identity token for backend verification

### Recommended setup
- Firebase Auth only, not Firebase as the primary app backend
- Use Firebase Admin SDK in backend for token verification

### Folder structure
```text
frontend/src/services/firebase.ts
backend/src/integrations/firebase/
```

### Must not handle
- Application domain logic
- Interview state
- Scoring
- Database schema ownership

---

## 4.5 Database Layer — PostgreSQL

### Responsibilities
- System of record for users, interviews, questions, responses, scores, templates, and audit history
- Enforce relational integrity and transaction boundaries
- Support reporting and analytics queries

### Recommended stack
- PostgreSQL 15+
- Prisma migrations
- Read replicas later if needed

### Must not handle
- LLM prompt execution
- UI state
- Auth token issuance

---

## 4.6 Real-Time / Voice Processing Layer

### Responsibilities
- Audio upload and storage
- Voice-to-text transcription
- Optional text-to-speech for interviewer voice
- Real-time partial transcription if supported

### Recommended approach
**MVP:**
- Use browser `MediaRecorder` for audio capture
- Send audio to backend
- Use external STT provider or AI service transcription endpoint

**Later:**
- WebSocket/SSE for live partial transcription
- Dedicated worker for transcription jobs

### Must not handle
- Score calculation
- Interview routing logic
- User permissions

---

## 5) AI / LLM Integration Strategy

## 5.1 Which LLM to use

### Recommended default
- **OpenAI GPT-4.1 or GPT-4o-class model** for question generation, evaluation, and feedback because it is strong at structured outputs, tool/function calling, and low-latency interaction.

### Optional fallback/provider abstraction
- Anthropic or another frontier model as a fallback for resilience or vendor diversity

### Model usage strategy
- **Question generation:** cheaper fast model with a strong prompt and rubric context
- **Answer evaluation:** stronger reasoning model with structured output
- **Final summary:** strong reasoning model, possibly batched asynchronously

This keeps cost lower while preserving quality where it matters.

## 5.2 Prompt engineering strategy

Use a **three-layer prompt design**:
1. **System prompt:** defines role, safety constraints, output format
2. **Domain prompt:** technical/HR/behavioral rules and interview style
3. **Session context prompt:** candidate role, skill level, previous answers, rubric, and interview progress

### Prompt rules
- Force structured JSON output
- Keep scoring rubric explicit
- Include answer evidence fields
- Require short rationale per score dimension
- Never let the model invent facts about the candidate

## 5.3 Interview flow structure

### Recommended phases
1. **Warm-up**: introduce the role and collect basics
2. **Core assessment**: domain-specific questions
3. **Depth probe**: follow-ups on weak areas
4. **Scenario / behavioral**: real-world judgment questions
5. **Wrap-up**: candidate questions and final summary

### Adaptive branching logic
- If answer score is high, increase difficulty or depth
- If answer score is low, ask clarification or fundamental question
- If confidence is low but correctness is moderate, probe reasoning
- Stop after target coverage or time budget

## 5.4 Evaluation logic

Use a structured scoring model with dimensions such as:
- Correctness / technical accuracy
- Depth of reasoning
- Clarity and communication
- Practicality / implementation awareness
- Confidence / uncertainty handling
- Domain-specific criteria

### Example output shape
```json
{
  "overall_score": 82,
  "dimension_scores": {
	"correctness": 85,
	"reasoning": 78,
	"communication": 80,
	"practicality": 84
  },
  "strengths": ["Clear explanation of tradeoffs"],
  "gaps": ["Missed edge-case handling"],
  "follow_up_recommendation": "Ask about error handling and retries",
  "confidence": 0.91
}
```

### Scoring safeguards
- Use rubric-based scoring, not free-form judgment alone
- Keep deterministic rules for obvious checks where possible
- Store model output plus final normalized score
- Allow human review override

---

## 6) PostgreSQL Database Design

## 6.1 Core tables

### `users`
- `id` (UUID, PK)
- `firebase_uid` (unique)
- `email`
- `full_name`
- `role` (`candidate`, `interviewer`, `admin`)
- `created_at`
- `updated_at`

### `interview_domains`
- `id` (UUID, PK)
- `name` (e.g., Technical, HR)
- `description`
- `is_active`

### `interview_templates`
- `id` (UUID, PK)
- `domain_id` (FK)
- `name`
- `difficulty_level`
- `rubric_json`
- `prompt_config_json`

### `interviews`
- `id` (UUID, PK)
- `user_id` (FK candidate)
- `created_by` (FK interviewer/admin)
- `domain_id` (FK)
- `template_id` (FK, nullable)
- `status` (`draft`, `active`, `paused`, `completed`, `cancelled`)
- `started_at`
- `ended_at`
- `overall_score`
- `summary`

### `questions`
- `id` (UUID, PK)
- `interview_id` (FK)
- `sequence_no`
- `question_text`
- `question_type` (`technical`, `behavioral`, `follow_up`)
- `expected_answer_guidance`
- `difficulty`
- `asked_by` (`ai`, `human`)
- `created_at`

### `responses`
- `id` (UUID, PK)
- `question_id` (FK)
- `interview_id` (FK)
- `user_id` (FK)
- `answer_text`
- `audio_url` (nullable)
- `transcript_text` (nullable)
- `submitted_at`

### `scores`
- `id` (UUID, PK)
- `response_id` (FK)
- `overall_score`
- `dimension_scores_json`
- `feedback_json`
- `model_name`
- `model_version`
- `confidence`
- `created_at`

### `interview_events`
- `id` (UUID, PK)
- `interview_id` (FK)
- `event_type`
- `payload_json`
- `created_at`

### `audit_logs`
- `id` (UUID, PK)
- `actor_user_id` (FK)
- `action`
- `entity_type`
- `entity_id`
- `metadata_json`
- `created_at`

## 6.2 Relationships

```text
users 1 --- n interviews
domains 1 --- n interview_templates
domains 1 --- n interviews
interviews 1 --- n questions
questions 1 --- n responses
responses 1 --- 1 scores
interviews 1 --- n interview_events
```

## 6.3 Basic schema notes
- Use UUIDs for external-safe identifiers
- Use transaction boundaries around interview completion
- Index `interviews(user_id, status, started_at)`
- Index `responses(interview_id, submitted_at)`
- Store model outputs as JSONB where needed
- Keep raw transcripts/audios separate from normalized scoring fields

---

## 7) API Design

## 7.1 API principles
- REST first for simplicity
- OpenAPI docs generated from backend
- Consistent versioning: `/api/v1`
- All sensitive operations require verified Firebase token
- Use idempotency keys for answer submission if needed

## 7.2 Endpoint list

### Auth/session
- `POST /api/v1/auth/session`
- `GET /api/v1/me`

### Interview setup
- `GET /api/v1/domains`
- `GET /api/v1/templates`
- `POST /api/v1/interviews`
- `GET /api/v1/interviews/:id`
- `PATCH /api/v1/interviews/:id`
- `POST /api/v1/interviews/:id/start`
- `POST /api/v1/interviews/:id/complete`

### Questions/responses
- `POST /api/v1/interviews/:id/questions/next`
- `POST /api/v1/interviews/:id/responses`
- `GET /api/v1/interviews/:id/responses`
- `GET /api/v1/interviews/:id/scores`

### History/reporting
- `GET /api/v1/history`
- `GET /api/v1/history/:id`
- `GET /api/v1/reports/:id`

### Voice/media
- `POST /api/v1/media/upload-url`
- `POST /api/v1/transcriptions`

## 7.3 Request/response examples

### Create interview
`POST /api/v1/interviews`
```json
{
  "candidateUserId": "uuid",
  "domainId": "uuid",
  "templateId": "uuid",
  "mode": "text",
  "difficulty": "medium"
}
```

Response:
```json
{
  "id": "uuid",
  "status": "active",
  "currentQuestion": {
	"id": "uuid",
	"text": "Explain the difference between async and defer in script loading."
  }
}
```

### Submit response
`POST /api/v1/interviews/:id/responses`
```json
{
  "questionId": "uuid",
  "answerText": "...",
  "audioUrl": null,
  "clientTimestamp": "2026-04-13T12:00:00Z"
}
```

Response:
```json
{
  "responseId": "uuid",
  "scoreStatus": "queued",
  "nextStep": "evaluation_pending"
}
```

## 7.4 Separation between services
- Frontend calls only backend API
- Backend calls AI service internally
- AI service never directly writes core app data unless via defined result contract
- Database access is only through backend persistence layer

---

## 8) Team Structure and Ownership

## 8.1 Frontend Team

### Owns
- React app
- UX flows
- Auth screens
- Interview experience
- Accessibility
- Client-side state management

### Does not own
- API business rules
- DB schema
- Prompt logic
- Scoring logic

## 8.2 Backend Team

### Owns
- REST API
- Firebase token verification
- Prisma models/migrations
- Interview orchestration
- Permission checks
- Async jobs and reporting APIs

### Does not own
- Frontend component implementation
- Prompt wording
- AI model selection beyond integration contracts

## 8.3 AI Team

### Owns
- Prompt libraries
- Rubric design
- Scoring schemas
- LLM provider abstraction
- Evaluation quality control
- Voice transcript interpretation logic

### Does not own
- UI
- Core session persistence
- User auth implementation

## 8.4 DevOps Team

### Owns
- Infrastructure provisioning
- CI/CD pipelines
- Secrets management
- Observability
- Logging/alerting
- Scaling and rollback strategy

### Does not own
- Product logic
- Prompt tuning
- UI implementation

## 8.5 Rules to prevent overlap
- Each service has a single code owner
- Shared contracts only through OpenAPI/JSON schemas
- No direct database access from frontend or AI service
- No prompt changes in backend without AI team review
- No UI assumptions inside backend or AI layers

---

## 9) Deployment Plan

## 9.1 Frontend hosting
- Deploy React app to **Vercel**, **Netlify**, or **Firebase Hosting**
- Use CDN caching for static assets
- Configure environment variables for API base URL and Firebase config

## 9.2 Backend hosting
- Deploy NestJS API to **Cloud Run**, **AWS ECS/Fargate**, or **Kubernetes**
- Start with containerized Cloud Run/ECS for simplicity
- Add autoscaling and health checks

## 9.3 AI service hosting
- Deploy FastAPI AI service separately from backend
- Scale independently because AI latency and CPU/memory patterns differ
- Use GPU only if self-hosting models; otherwise API-based inference is enough

## 9.4 Database hosting
- Managed PostgreSQL via **AWS RDS**, **Cloud SQL**, or **Neon/Supabase** for early-stage speed
- Use automated backups and point-in-time recovery

## 9.5 CI/CD basics
- PR checks: lint, test, typecheck, build
- Separate pipelines for frontend, backend, AI service
- Deploy only from main branch after tests pass
- Use environment promotion: dev -> staging -> prod
- Store secrets in a managed secrets vault

---

## 10) Security, Scalability, and Best Practices

## 10.1 Security
- Verify every request with Firebase Admin token validation
- Enforce RBAC on backend routes
- Use signed upload URLs for audio and file uploads
- Encrypt secrets at rest and in transit
- Sanitize and validate all inputs
- Log access and admin actions
- Apply rate limiting to auth and AI-heavy endpoints

## 10.2 Scalability
- Keep backend stateless
- Use queues for long-running AI evaluation or transcription
- Cache static domain templates and rubric metadata
- Use read replicas for analytics/reporting later
- Separate hot paths (live interview) from heavy async paths (final report generation)

## 10.3 Code structure
- Monorepo is recommended if the team is small, but preserve service boundaries
- Shared libraries only for types/contracts, not business logic
- Avoid cyclic dependencies between frontend/backend/AI projects

## 10.4 Version control strategy
- Use trunk-based development or short-lived feature branches
- Require PR review by code owners
- Tag releases by service
- Keep OpenAPI and schema migrations versioned

## 10.5 Observability
- Structured logs with request IDs
- Metrics for interview completion rate, AI latency, scoring time, error rate
- Traces across frontend -> backend -> AI service
- Alert on queue backlog and failed evaluations

---

## 11) Recommended Repository Layout

```text
ai-interviewer/
  apps/
	web/
	api/
	ai-service/
  packages/
	contracts/
	ui-kit/
	config/
  infra/
	terraform/
	k8s/
  docs/
	architecture/
	api/
	runbooks/
```

### Why this layout
- Clear service separation
- Independent deployment paths
- Shared contracts remain explicit and minimal
- Teams can work in parallel without stepping on each other

---

## 12) Phased Delivery Plan

### Phase 1 — MVP
- Firebase auth
- React interview UI
- Backend interview sessions
- Text-based Q&A
- Basic rubric scoring
- PostgreSQL persistence

### Phase 2 — Production hardening
- Async scoring jobs
- Interview history and reporting
- Role-based access
- Observability and audit logs
- Prompt versioning

### Phase 3 — Voice and intelligence
- Audio upload
- Transcription pipeline
- Follow-up question generation
- Better domain templates
- Analytics on candidate performance trends

### Phase 4 — Scale
- Multi-tenant support
- Advanced admin analytics
- Provider fallback for AI models
- Searchable interview corpus

---

## 13) Final Recommendation

For a real startup, the best balance of speed and maintainability is:
- **React + TypeScript** for frontend
- **Firebase Auth** for identity only
- **NestJS + Prisma + PostgreSQL** for the main backend
- **FastAPI** for AI orchestration and scoring
- **Redis + BullMQ** for async work
- **Managed PostgreSQL** and **containerized deployment**

This gives you strict modular separation, clean team ownership, and a path to scale without overengineering the MVP.

