# EasySLR — Article Review Workspace

A systematic literature review workspace that lets research teams import PubMed article exports, screen them with Include / Exclude / Maybe decisions, and export a clean shortlist.

---

## What it does

Systematic literature reviews involve importing hundreds of research articles from databases like PubMed, screening each one for relevance, and tracking decisions across a team. Most researchers do this in spreadsheets — which breaks down quickly at scale.

EasySLR gives researchers a proper workspace: upload your PubMed Excel export, screen articles one by one or in bulk, add reviewer notes, and export the final shortlist as CSV.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Server Components colocate data fetching with UI, reducing client JS |
| Styling | Tailwind CSS | Constraint-based utility system — faster iteration, consistent spacing |
| Database | PostgreSQL + Prisma | Best-in-class TypeScript ORM, readable schema, first-class migrations |
| Auth | NextAuth.js v5 | Native Prisma adapter, GitHub OAuth out of the box |
| API | tRPC | End-to-end type safety from DB to React component, no code generation step unlike GraphQL |
| Excel parsing | SheetJS (xlsx) | De-facto standard for browser-side Excel parsing |
| Tests | Vitest | Jest-compatible, ESM-native, no transform step needed |
| Deployment | Vercel + Neon | Vercel is Next.js's native platform. Neon is serverless Postgres that scales to zero |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Docker (for local Postgres) or a Neon/Supabase connection string
- A GitHub OAuth app

### 1. Clone and install

```bash
git clone <your-repo-url>
cd easySLR
npm install
```

### 2. Create a GitHub OAuth app

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Set:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Generate with: npx auth secret
AUTH_SECRET="your-generated-secret"

# From GitHub OAuth app
AUTH_GITHUB_ID="your-client-id"
AUTH_GITHUB_SECRET="your-client-secret"

# Local Postgres (Docker) or remote connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/easySLR"

NEXTAUTH_URL="http://localhost:3000"
```

### 4. Start the database

If using Docker:

```bash
./start-database.sh
```

This script reads your `DATABASE_URL` and spins up a Postgres container automatically.

### 5. Run migrations and start

```bash
npm run db:push     # apply schema to database
npm run dev         # start at http://localhost:3000
```

Sign in with GitHub, create an organization, create a project, and upload the sample Excel file.

---

## Architecture

### Domain model

```
User
 └── OrganizationMember (role: OWNER | MEMBER)
      └── Organization
           └── Project
                └── ProjectMember (role: OWNER | REVIEWER)
                └── Article
                     └── Review (decision: PENDING | INCLUDE | EXCLUDE | MAYBE)
```

Every article belongs to a project. Every review belongs to a user and an article — each user has their own decision on each article. This supports single-reviewer screening, with multi-reviewer consensus as a future addition.

### Authorization

Project access is enforced server-side on every tRPC procedure and API route via a shared helper:

```ts
// src/server/auth/access.ts
async function requireProjectAccess(userId, projectId) {
  const member = await db.projectMember.findUnique(...)
  if (!member) throw new TRPCError({ code: "FORBIDDEN" })
}
```

This is called at the top of every article list, import, bulk update, review upsert, and CSV export handler. The UI hiding content from non-members is secondary — the server never trusts client-side state.

### API layer

All data mutations go through tRPC procedures. Server Components use a direct server-side tRPC caller. Client Components use tRPC React Query hooks. No raw fetch calls anywhere in the codebase.

---

## Review Workflow

I chose **Include / Exclude / Maybe** because this maps directly to how title/abstract screening works in a real systematic review:

- **Include** — article passes screening, moves to full-text review
- **Exclude** — article is clearly irrelevant
- **Maybe** — uncertain, needs a second look

Decisions are set with a single click on large buttons — no dropdown, no confirm step. When you are screening 300 articles, the fewer interactions per decision the better. Notes auto-save one second after you stop typing. No save button needed.

The slide-over review panel was a deliberate choice over a modal. It keeps the article table visible while you are reviewing, so you maintain context of what you have already screened.

---

## Article Import

The import flow is two steps: **preview first, confirm second**.

After uploading an Excel file, every row is validated and shown in a colour-coded preview table before anything is written to the database:

- **Green** — valid, will import
- **Amber** — warning, imports with a flag
- **Red** — invalid, will be skipped

Only after the user clicks confirm does the server write the rows. The server re-validates on confirm — client-side validation is UX only.

### Validation rules

| Field | Rule | Outcome |
|---|---|---|
| PMID | Blank | Skip — cannot deduplicate without identifier |
| PMID | Non-numeric | Skip — invalid format |
| PMID | Duplicate in file | Skip second occurrence |
| PMID | Already in project | Skip |
| Title | Blank | Skip — cannot screen without a title |
| DOI | Strip `DOI:` prefix, lowercase, trim | Normalise |
| DOI | Duplicate in file or project | Skip |
| Publication Year | Non-numeric (e.g. "Twenty twenty") | Skip — data quality issue |
| Publication Year | Future year | Import with warning — valid for preprints |
| All fields | Leading/trailing whitespace | Trimmed automatically |

**Why these rules:** Missing title and missing PMID are hard stops — you cannot meaningfully screen an untitled article and you cannot detect duplicates without an identifier. Future publication years are warnings not errors because preprints legitimately appear before formal publication. The distinction matters: an error stops import, a warning lets the researcher decide.

---

## Assumptions and Tradeoffs

**Vercel over AWS** — The brief mentioned AWS + SST as a strong positive signal. I chose Vercel because it is Next.js's native deployment platform and requires zero infrastructure configuration. SST shines when you need Lambda functions, SQS queues, or S3 — none of which this application requires. Choosing the right tool matters more than choosing the impressive-sounding tool.

**Single reviewer per article** — Reviews are per-user per-article. There is no multi-reviewer consensus. This keeps the data model clean. Adding consensus requires product decisions about what agreement means (majority? unanimous? what happens on conflict?) that should be made deliberately, not assumed.

**Owner/Reviewer roles modelled, not fully enforced** — The schema has `OWNER` and `REVIEWER` roles on both organizations and projects. Currently all project members have equal access. A production version would restrict import and member management to project owners. I documented this rather than half-implementing it.

**No saved filters** — Users can search and filter by decision, but filter combinations are not persisted. This requires a `SavedFilter` model and additional UI. Scoped out deliberately.

**Free-text notes over structured tags** — The review panel has a notes field rather than tags or labels. Tags add UI and data complexity (tag management, tag filtering) without knowing what vocabulary researchers actually use.

---

## Known Gaps

- Owner/Reviewer role enforcement in the UI
- Saved filter presets
- Multi-reviewer consensus view
- Invite member by email (currently requires the user to sign in first)
- Full-text review phase (this covers title/abstract screening only)

---

## Deployment

Deployed on **Vercel** with **Neon** (serverless Postgres).

**Secrets** — All environment variables live in the Vercel dashboard. Nothing sensitive is in the repository. `.env` is in `.gitignore`.

**Migrations** — `prisma migrate deploy` runs automatically via the `postinstall` script on every Vercel build. Schema changes are applied before new code goes live.

**Database** — Neon provides connection pooling via its serverless driver, which works with Vercel's serverless function model where connections cannot be held open between requests.

**Failure modes** — If a migration fails, the Vercel build fails and the previous deployment stays live. Database errors surface as tRPC errors with appropriate UI messaging.

**Costs** — Vercel hobby tier is free. Neon free tier covers 0.5 GB storage and 100 compute hours per month, well within range for a demo workload.

---

## Tests

```bash
npm run test
```

Tests cover the two behaviours that matter most and are hardest to verify by eye:

**Import validation** (`src/lib/import/validateRow.test.ts`) — pure unit tests, no database needed:
- Blank PMID → error
- Non-numeric PMID → error
- Blank title → error
- Non-numeric year → error
- Future year → warning, not an error
- `DOI:10.1000/x` normalises to `10.1000/x`
- Duplicate PMID in same batch → second row flagged
- Duplicate DOI in same batch → second row flagged
- Whitespace trimmed across all fields

**Project access control** (`src/server/api/routers/article.test.ts`):
- Import attempt by a non-member returns FORBIDDEN

---

## AI Usage

I used **Claude Code** (Anthropic) throughout this project.

**What was AI-assisted:**
- Code implementation — tRPC routers, Prisma queries, React components, Tailwind styling, animations

**What I did personally:**
- All architecture and design decisions — domain model structure, authorization approach, review workflow choice and rationale
- All tradeoffs — Vercel over AWS, single-reviewer model, scope decisions
- Logic design — what counts as a hard error vs a warning in import validation, why each field has the rule it has
- Verified the authorization model — confirmed `requireProjectAccess` is called server-side on every endpoint
- Tested the running application end-to-end — sign in, create org, create project, upload sample file, review articles, export CSV
- All UX decisions — slide-over vs modal, button group vs dropdown, floating bulk bar

**One example where I corrected AI output:**
The initial suggestion for deployment was AWS with SST. I rejected this because SST is designed for Lambda and SQS pipeline architectures — infrastructure this application has no need for. I chose Vercel as the correct tool and wrote the justification myself.

---

## Approximate Time Spent

~8 hours across two days.

---

## What I Would Improve Next

1. **Multi-reviewer consensus** — Define an agreement threshold and surface conflicts for discussion
2. **Owner/Reviewer role enforcement** — Restrict import and project management to project owners
3. **Saved filter presets** — Let users save decision + search combinations as named views
4. **Invite member by email** — Currently requires the user to already have signed in
5. **Zotero / Mendeley import** — PubMed is one source; researchers use many reference managers
6. **Full-text review phase** — A second screening stage after title/abstract screening
