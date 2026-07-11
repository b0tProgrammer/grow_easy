# GrowEasy CSV Importer

An AI-powered CSV → CRM importer. Upload a CSV in **any** shape — a Facebook
Lead Ads export, a Google Ads export, a hand-built spreadsheet, a real-estate
CRM dump — and it gets mapped into GrowEasy's fixed CRM schema automatically,
with no per-source code.

The hard problem this solves isn't parsing CSV. It's that source column
names, order, and structure are unpredictable. All of that variability is
pushed into one carefully engineered AI prompt; everything else in the
system exists to call that prompt safely, at scale, and to show the user
what happened.

---

## How it works

```
┌────────────┐   1. drag & drop CSV       ┌─────────────────┐
│  Frontend  │ ─────────────────────────▶ │  Client-side     │
│  (Next.js) │                            │  parse (Papa)    │
└────────────┘ ◀───────────────────────── │  → preview table │
      │           2. confirm import        └─────────────────┘
      │ POST /api/import (multipart)
      ▼
┌────────────────────────────────────────────────────────────────┐
│ Backend (Express)                                               │
│  csvParser → rows[]                                             │
│  batchProcessor: chunk rows (20/batch), run with bounded         │
│    concurrency (3 at a time), retry w/ backoff on failure        │
│      └─▶ aiExtractor: build prompt → call LLM → parse strict     │
│           JSON → sanitize/validate (enums, dates, skip rule)     │
│  jobStore: in-memory job, progress pushed over SSE                │
└────────────────────────────────────────────────────────────────┘
      │  3. SSE progress + final result
      ▼
┌────────────┐
│  Frontend  │  4. result table: imported vs skipped, with reasons
└────────────┘
```

**Frontend steps map 1:1 to the assignment spec:**
1. Upload (drag & drop or file picker)
2. Preview (parsed client-side, no AI call yet)
3. Confirm (only now does the backend get called)
4. Result (imported / skipped, with totals)

## Why this architecture

- **Prompt engineering is the actual product.** `backend/src/services/promptBuilder.js`
  encodes the CRM schema with per-field *semantics* (not just names), the exact
  business rules from the assignment (enum lists, skip rule, multi-email/phone
  handling) as numbered instructions, and a strict JSON output contract keyed
  by `original_index` so every row can always be traced back to its source,
  whether it was imported or skipped.
- **The AI is not trusted blindly.** `backend/src/utils/validators.js`
  re-validates every field the model returns — enum values outside the
  allowed list are dropped, unparseable dates are cleared, and the "skip if no
  email/mobile" rule is *re-enforced server-side* even if the model got it
  wrong. Rows the model silently drops from its response are still accounted
  for as skipped, so `totalImported + totalSkipped` always equals the row
  count in the uploaded file.
- **Batching + concurrency + retries**, because a real CSV might be
  thousands of rows: `batchProcessor.js` chunks rows, runs a bounded number
  of batches in parallel (`p-limit`), and retries a failed batch with
  exponential backoff before giving up — and even then, every row in a
  permanently-failed batch is reported back as an explicit "skipped" record
  with the failure reason, never silently dropped.
- **Async job + SSE progress**, not a single blocking request: upload
  returns a `jobId` immediately, and the frontend subscribes to live batch
  progress over Server-Sent Events (falling back to polling if SSE drops),
  which is what powers the progress bar during AI processing.
- **Provider-agnostic AI layer**: `services/providers/{anthropic,openai,gemini}.js`
  all implement the same `callModel(systemPrompt, userPrompt)` interface, so
  swapping the model is a one-line env var change (`AI_PROVIDER`), not a
  rewrite.

---

## Project structure

```
groweasy-csv-importer/
├── backend/
│   └── src/
│       ├── config/constants.js       CRM fields, enums, tunables (single source of truth)
│       ├── services/
│       │   ├── csvParser.js          CSV → rows, no assumptions about headers
│       │   ├── promptBuilder.js      system + user prompt construction
│       │   ├── aiExtractor.js        calls the model, parses + validates one batch
│       │   ├── batchProcessor.js     chunking, concurrency, retries
│       │   ├── jobStore.js           in-memory async job + progress pub/sub
│       │   └── providers/            anthropic.js / openai.js / gemini.js
│       ├── routes/import.js          POST /api/import, GET /:jobId, GET /:jobId/events (SSE)
│       ├── middleware/                upload (multer) + centralized error handler
│       └── utils/validators.js       sanitizes AI output (enums, dates, CSV-safety)
├── frontend/
│   ├── app/page.tsx                  4-step flow (upload/preview/processing/result)
│   ├── components/                   UploadZone, PreviewTable, ProcessingPanel, ResultTable, Stepper
│   └── lib/                          api.ts (SSE client), types.ts
└── docker-compose.yml
```

---

## Setup

### Prerequisites
- Node.js 18+
- An API key for at least one of: Anthropic, OpenAI, Gemini

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set AI_PROVIDER and the matching API key
npm install
npm run dev        # http://localhost:8080
```

### 2. Frontend

```bash
cd frontend
npm install
# optional: create .env.local with NEXT_PUBLIC_API_BASE_URL if backend isn't on localhost:8080
npm run dev         # http://localhost:3000
```

### 3. Or run both with Docker

```bash
cp backend/.env.example backend/.env   # fill in your API key
docker compose up --build
```

---

## Deployment

- **Frontend → Vercel**: import the `frontend/` directory as the project
  root, set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.
- **Backend → Render / Railway**: deploy the `backend/` directory, set
  `AI_PROVIDER`, the matching API key, and `FRONTEND_ORIGIN` to your deployed
  frontend URL (for CORS).

---

## Configuration reference (`backend/.env`)

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `anthropic` \| `openai` \| `gemini` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | key for the selected provider |
| `BATCH_SIZE` | rows per AI call (default 20) |
| `MAX_CONCURRENT_BATCHES` | parallel batches in flight (default 3) |
| `MAX_RETRIES` | retries per failed batch before giving up (default 2) |
| `FRONTEND_ORIGIN` | allowed CORS origin(s), comma-separated |

---

## What's implemented from the bonus list

- Drag & drop upload
- Real progress indicator during AI processing (SSE, with polling fallback)
- Retry mechanism for failed AI batches (exponential backoff)
- Bounded-concurrency batch processing (not sequential, not unlimited)
- Sticky-header, scrollable tables for both preview and results
- Dark mode (the default and only theme here, by design)
- Docker setup for both services + docker-compose
- This README

Not implemented (left as explicit scope cuts, not oversights): a database
(the assignment marks it optional — the app is stateless by design, jobs
live in memory with a TTL), automated tests, and row-virtualization for
very large tables (the preview caps at 200 rows client-side with a note;
the result table renders all rows, which is fine into the low thousands but
would want `react-window` beyond that).
