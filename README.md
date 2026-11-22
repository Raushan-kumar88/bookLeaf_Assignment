# BookLeaf — Author Support & Communication Portal

An AI-assisted support portal for a self-publishing company. **Authors** raise
support tickets about their books (royalties, ISBN, printing, distribution,
production status); the BookLeaf **operations team** manages them from an admin
console where an LLM **auto-classifies** each ticket, assigns a **priority**, and
**drafts a reply** grounded in BookLeaf's knowledge base. Replies reach the author
in **real time**.

> MERN monorepo with a clear `server/` (API) and `client/` (React) split.
> See [`WRITEUP.md`](./WRITEUP.md) for the one-page approach & trade-offs.

---

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React + Vite + React Router                                   |
| Backend    | Node.js + Express                                             |
| Database   | MongoDB + Mongoose (Atlas)                                    |
| Auth       | JWT + bcrypt, role-based (author / admin)                     |
| Real-time  | Socket.IO                                                     |
| AI / LLM   | Google **Gemini** (`gemini-flash-latest`) via the OpenAI SDK  |
| API docs   | Swagger / OpenAPI at `/api/docs`                              |
| Validation | Zod                                                           |

## Features

**Author portal**
- Email/password login; each author sees only their own data.
- **My Books** — title, ISBN, genre, publication date, status, MRP, copies sold,
  royalty earned / paid / pending (in-production books render gracefully).
- **Submit a Query** — book dropdown (or General/Account), subject, description,
  optional attachment (UI).
- **My Tickets** — list + detail with status, the original query, and admin
  responses that appear **live** (no refresh) via Socket.IO.

**Admin portal**
- **Ticket Queue** — all tickets, filter by status / category / priority / date,
  sorted most-urgent + oldest first.
- **AI auto-classification** into one of six categories (admin-overridable).
- **AI priority score** — Critical / High / Medium / Low (admin-overridable).
- **AI-drafted reply** grounded in the knowledge base **and the book's real
  figures**; editable before sending.
- **Ticket management** — status, assign-to-self, internal notes (hidden from
  authors).

## Repository layout

```
bookleaf-portal/
├── server/                 # Express REST API + Socket.IO + AI service
│   └── src/
│       ├── config/         # env, database, swagger
│       ├── models/         # Mongoose schemas (User, Book, Ticket, Message)
│       ├── routes/         # Express routers (thin)
│       ├── controllers/    # HTTP handlers (one job each)
│       ├── services/       # business logic (ai, ticket, admin, auth, book)
│       ├── middleware/      # auth, role (RBAC), validate (Zod), error handler
│       ├── validators/     # Zod request schemas
│       ├── knowledge/      # BookLeaf knowledge base (AI context)
│       ├── sockets/        # Socket.IO wiring + emit helpers
│       ├── seed/           # sample dataset + DB seeder
│       └── utils/          # ApiError, asyncHandler
└── client/                 # React app
    └── src/
        ├── api/            # REST client
        ├── context/        # Auth + Socket providers
        ├── components/     # ProtectedRoute, Layout, Badges
        └── pages/          # Login, author/*, admin/*
```

**Why this shape:** routes stay thin, controllers only handle HTTP, and all real
work lives in `services/`. AI logic, data access, and transport concerns are
separate — easy to test, swap, and explain.

---

## Getting started (local)

Prerequisites: Node 18+, a MongoDB instance (local or MongoDB Atlas), and a
Gemini **or** OpenAI API key (optional — the app runs without one via a fallback).

```bash
# 1. Backend
cd server
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET, and the LLM keys
npm install
npm run seed             # loads 10 authors / 18 books + 1 admin
npm run dev              # API on http://localhost:5000  (docs at /api/docs)

# 2. Frontend (separate terminal)
cd client
npm install
npm run dev              # app on http://localhost:5173
```

### Environment variables (`server/.env`)

| Var               | Purpose                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `MONGO_URI`       | MongoDB connection string (Atlas).                                  |
| `JWT_SECRET`      | JWT signing secret.                                                  |
| `OPENAI_API_KEY`  | LLM key (OpenAI **or** Gemini). Empty → rules-based fallback.        |
| `OPENAI_MODEL`    | `gemini-flash-latest` (Gemini) or `gpt-4o-mini` (OpenAI).            |
| `OPENAI_BASE_URL` | Gemini's OpenAI-compatible endpoint (empty for OpenAI).             |
| `DNS_SERVERS`     | Optional public DNS (e.g. `8.8.8.8,1.1.1.1`) if Atlas SRV fails.     |

> The key lives on the server only and is **never** exposed to the frontend.

### Test credentials

Password for **all** accounts: `Password123!`

| Role   | Email                       |
| ------ | --------------------------- |
| Admin  | `admin@bookleaf.com`        |
| Author | `priya.sharma@email.com`    |
| Author | `rohit.kapoor@email.com` (+ 8 more from the dataset) |

---

## AI integration (the core of the evaluation)

All LLM calls live in [`server/src/services/ai.service.js`](server/src/services/ai.service.js);
the knowledge base is [`server/src/knowledge/kb.js`](server/src/knowledge/kb.js).

**Model choice.** We use Google **Gemini `gemini-flash-latest`** through the
**OpenAI SDK** (Gemini exposes an OpenAI-compatible endpoint). Reasons: Gemini has
a generous free tier (no billing needed for evaluation), `flash` is fast and cheap,
and using the OpenAI SDK means switching to OpenAI (`gpt-4o-mini`) is a two-line
env change — no code rewrite. The provider is configured entirely via env vars.

**Prompt engineering.** Two focused prompts:
1. *Classify + prioritise* — one call returns strict JSON `{category, priority}`
   with the exact enums and priority guidance (unpaid royalties / wrong-ISBN =
   Critical/High; simple how-to = Low).
2. *Draft reply* — a system prompt that sets the BookLeaf support-rep persona and
   tone, injects the **category-relevant** knowledge-base slice, plus a compact set
   of the book's **real facts** (sold, earned, paid, pending, last payout). The
   model is told to use only those facts and never invent numbers.

**Cost awareness.**
- Classification + priority is **one** call, not two, `temperature: 0`.
- Drafts inject only the **relevant KB slice** (not the whole KB) and the single
  ticket (no full conversation history).
- `max_tokens` is capped on every call.

**Graceful degradation.** No key, or any API error/timeout, falls back to a
rules-based keyword classifier and a templated draft — so **tickets are always
created and classified**, and admins can always reply manually. Each ticket records
which path was used (`ai.model` = `gemini-flash-latest` or `fallback`).

**Security.** The API key is read from `process.env` on the server only and never
sent to the client.

---

## API

Interactive docs (with "Try it out"): **`GET /api/docs`** · raw spec: `/api/docs.json`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | Log in, get JWT |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/books` | author | The author's books |
| POST | `/api/tickets` | author | Raise a ticket (AI classifies) |
| GET | `/api/tickets` | author | The author's tickets |
| GET | `/api/tickets/:id` | author | Ticket + public messages |
| GET | `/api/admin/tickets` | admin | Queue (filters + sort) |
| GET | `/api/admin/tickets/:id` | admin | Full ticket (+ internal notes) |
| PATCH | `/api/admin/tickets/:id` | admin | Status / override / assign |
| POST | `/api/admin/tickets/:id/messages` | admin | Public reply to author |
| POST | `/api/admin/tickets/:id/notes` | admin | Internal note |
| POST | `/api/admin/tickets/:id/ai-draft` | admin | Generate AI draft |

All private routes are protected by JWT auth + role middleware; authors are
further scoped to their own `userId`. Validation errors return `400` with
per-field messages; there are no generic `500`s for expected failures.

**Real-time:** clients open a JWT-authenticated Socket.IO connection and join a
room (`author:<id>` or `admin`). Events: `ticket:new` (→ admins), `ticket:updated`
(→ author + admins), `message:new` (→ author).

---

## Known limitations / future improvements

- **File attachments** are UI-only (names stored, no upload) — would add S3/Cloud
  storage with signed URLs.
- **Draft caching:** an AI draft is generated on demand each time; caching the last
  draft per ticket would cut cost further.
- **Tests:** manual + scripted smoke tests were used; a Jest/Supertest suite and
  component tests would harden it for CI.
- **Pagination** on the admin queue for very large volumes.
- **Refresh tokens / token revocation** for longer-lived sessions.
- **Rate limiting** on auth and AI endpoints.
