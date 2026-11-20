# BookLeaf Portal — Approach & Trade-offs

## What I prioritised

The brief weights **AI integration** and **architecture** highest, so I built from
the core outward: a clean, layered API first, then the AI service, then the two
UIs. My ordering was deliberate — the full ticket lifecycle (author raises → AI
classifies & prioritises → admin drafts & replies → author sees it live) had to
work end-to-end before any polish. I developed in small, reviewable phases and
verified each one (scripted API tests + a real browser walk-through) before moving
on, so nothing was "done" on faith.

## Architecture

A MERN monorepo split into `server/` and `client/`. On the server I kept a strict
**routes → controllers → services → models** flow: routers only wire paths,
controllers only handle HTTP, and *all* business logic lives in services. That one
decision pays off everywhere — the AI logic, data access, and Socket.IO emits are
isolated and independently testable, and swapping the LLM or the transport touches
one file, not ten. Cross-cutting concerns (JWT auth, role-based access, Zod
validation, a central error handler, typed `ApiError`s) are middleware, so every
route inherits them for free and failures return clean, specific JSON.

The data model is **normalised** (User / Book / Ticket / Message) even though the
sample data arrives nested — tickets reference books and users by id, which keeps
the admin queue and author-scoped queries simple and indexed. One `Message` model
with a `visibility` flag covers both public replies and internal notes, so RBAC is
a single query filter rather than two code paths.

## AI integration

I treated the LLM as an untrusted, sometimes-unavailable dependency. Classification
and priority are a **single** JSON call (cheap, deterministic at `temperature 0`);
drafting injects only the **category-relevant** knowledge-base slice plus the
book's **real royalty figures**, so replies cite actual numbers and policy instead
of generic fluff. Every call is wrapped so that a missing key, a rate-limit, or a
bad response **falls back** to a rules-based classifier and a templated reply —
tickets are never blocked, and admins can always write manually. I used Gemini via
its OpenAI-compatible endpoint through the OpenAI SDK, which gives a free tier for
evaluation and makes switching providers a config change.

## Trade-offs I made

- **Normalise vs. mirror the nested JSON:** I normalised, trading a slightly more
  involved seeder for far cleaner queries and relationships.
- **Polling vs. sockets:** I chose Socket.IO for genuinely live updates; it's a bit
  more wiring than polling but demos far better and scales more cleanly.
- **UI depth vs. correctness:** per the brief I kept the UI clean and functional
  rather than pixel-perfect, and spent the time on the AI, RBAC, and edge cases
  (in-production books, zero-royalty, empty states).
- **On-demand drafts:** generated fresh each time for simplicity; caching is an
  easy later win.

## Evolving to production

I'd add a Jest/Supertest suite and component tests in CI; move attachments to
object storage with signed URLs; introduce rate limiting and refresh-token
rotation; cache drafts and trending KB lookups to cut LLM cost; paginate and index
the admin queue for high volume; add structured logging/metrics and an audit trail
for AI overrides (the `*Overridden` flags already capture the signal); and put the
LLM behind a small provider-abstraction with retries, timeouts, and a circuit
breaker so degradation is observable, not just silent.
