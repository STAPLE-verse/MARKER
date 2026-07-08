# Target Architecture & Tech Stack

This document outlines the architectural decisions and technology stack for the **MARKER** platform, specifically detailing how it integrates within the broader **STAPLE** ecosystem.

## 1. Core Technology Stack

- **Framework**: Next.js (App Router)
- **UI & Styling**: Tailwind CSS v4, DaisyUI v5, and Heroicons
- **Database**: PostgreSQL (Single Shared Database with STAPLE)
- **ORM**: Prisma
- **Authentication**: Auth.js (NextAuth beta)

## 2. Repository Strategy: Multi-Repo & Shared Packages

We have deliberately chosen **not** to use a monolithic Monorepo for the main applications.

**Rationale**: 
STAPLE currently relies on an older version of Next.js and Blitz.js, while MARKER uses the modern Next.js App Router. A monorepo for the apps would introduce significant dependency conflicts.

**The Form Builder Package (`@staple-verse/form-builder`)**:
To share complex UI logic without tangling the repositories, the core JSON Schema Form Builder will be extracted into a third, standalone repository. 
- It will be published as a pure React NPM package.
- **STAPLE** will consume it for day-to-day, fast project management forms.
- **MARKER** will consume it for advanced metadata editing, ontology mapping (e.g., CEDAR), and community publishing.

**The Core UI & Styling Package (`@staple-verse/ui`)**:
To ensure strict visual consistency across the ecosystem, all base components (Buttons, Cards, Inputs) and the core Tailwind styling configuration will also be extracted into a shared UI package.
- It will act as the single source of truth for the STAPLE design system.
- Both apps will `npm install` this package, ensuring that a design change propagates to both STAPLE and MARKER without duplicating code.

During development, `npm link` (or `yalc`) will be used to test changes across these shared packages and the main repositories instantly.

## 3. Database Architecture (Single Source of Truth)

To maintain strict data integrity and enable seamless user flows, STAPLE and MARKER will share a **single PostgreSQL database**, hosted by STAPLE.

**Why a single database?**
- Allows foreign keys linking MARKER forms back to the STAPLE `User` table.
- Eliminates cross-database fetching (N+1 problems).
- Maintains transactional safety when moving forms between platforms.

*Note on IDs: MARKER's authentication schema has been updated to use `Int` IDs for Users to match STAPLE's schema.*

## 4. Authentication & Subdomains

MARKER is a subservice of STAPLE. Users must have a STAPLE account to use MARKER.

- **Shared Database**: MARKER reads the `User` table directly from the STAPLE database.
- **Shared Session Cookies**: STAPLE and MARKER will operate on the same root domain (e.g., `.staple-verse.org`). By sharing the exact same `AUTH_SECRET` environment variable, MARKER's Auth.js can read and decrypt the session cookies issued by STAPLE. This provides instant Single Sign-On (SSO) with zero API latency.

## 5. MARKER Product Identity

MARKER is a **metadata schema workspace** — a curated library for metadata templates, not a mirror of STAPLE. The best analogy is:

- **Zotero** (personal reference library) — MARKER's private collection: users deliberately add schemas by creating them from scratch, importing from STAPLE, uploading JSON files, importing from CEDAR/RedCap, or forking published schemas. Not every STAPLE form appears in MARKER — only the ones the user intentionally brings in.
- **Zenodo** (public archive) — MARKER's public marketplace: users publish immutable, FAIR-compliant schemas with persistent identifiers (PIDs) for the community to discover, cite, and reuse.

### STAPLE vs. MARKER: Role Separation

| | **STAPLE** (Project Manager) | **MARKER** (Metadata Librarian) |
|---|---|---|
| **Purpose** | Day-to-day project management | Metadata schema curation, sharing, and archival |
| **Primary entity** | `Form` + `FormVersion` (tied to Tasks and Projects) | `Form` (drafts) + `PublishedSchema` (published, immutable) |
| **Forms are** | Task checklists, data collection instruments, consent forms | Reusable metadata templates intended for publication |
| **Folders/Tags** | Organize by project workflow | Organize by domain, topic, or publication status |

Both apps read and write to the **same `Form` table** in the shared database. To distinguish which forms belong to which app's workspace, the `Form` model includes an `app` field:

```prisma
model Form {
  app  String  @default("staple")  // "staple" | "marker"
}
```

This is a pure **product scoping** concern — it answers "which app's collection does this form appear in?" and nothing else.

### Import-as-Copy Semantics

When a user imports a STAPLE form into MARKER, a **new `Form` row** is created (a copy, not a reference). The original STAPLE form is unaffected:

- The MARKER copy gets `app: "marker"` and its own independent `folderId`, `tags`, etc.
- The user can modify the schema in MARKER without affecting their STAPLE project.
- This follows the same snapshot pattern as publishing: data flows one-directionally as copies.

```
STAPLE Form → (import/copy) → MARKER Form → (publish/freeze) → PublishedSchema
CEDAR JSON  → (upload/copy) → MARKER Form → (publish/freeze) → PublishedSchema
```

### Folders & Tags Scoping

The existing `Folder` and `Form.tags` models are shared infrastructure. Because MARKER only queries forms where `app = "marker"`, the organizational layer is naturally scoped — a MARKER user's folders and tags organize only their MARKER schemas, even though the `Folder` table is shared.

### Provenance vs. Product Scoping (Separation of Concerns)

The `app` field on `Form` is strictly a **product scoping** mechanism. **Provenance** — the full traceable origin and lineage of a schema — is a separate, richer system governed by FAIR data principles:

- `PublishedSchema.source` — origin format ("native", "cedar", "redcap")
- `PublishedSchema.derivedFromPid` — fork lineage
- `PublishedSchema.originFormVersionId` — link back to the original draft
- JSON-LD `@context` at export — Dublin Core, PROV-O vocabulary mappings

These concerns must not be conflated. Provenance requires multiple fields and careful metadata design; product scoping is a simple binary routing question.

## 6. Schema Data Models & Versioning

STAPLE and MARKER handle forms differently based on their lifecycle stage.

- **STAPLE (The Workshop)**: Uses `Form` and `FormVersion` tables. These track the messy, private, iterative process of drafting forms for specific project tasks.
- **MARKER (The Marketplace)**: Also uses `Form` and `FormVersion` for drafts (scoped by `app: "marker"`), and a dedicated `PublishedSchema` table for immutable, published schemas ready for community sharing.

### Versioning Strategy (The "Free DOI" approach)
Because DOIs are cost-prohibitive, MARKER guarantees traceability through **Immutability**.
- When a user publishes a form to MARKER, it is saved to the `PublishedSchema` table with a unique, persistent string identifier (PID, e.g., `ps_8f9a2b`) and a semantic version (e.g., `1.0.0`).
- **Immutable**: Once a `PublishedSchema` row is created, its JSON schema can never be edited.
- **Updates**: If an author updates a schema, a new row is created with the same `familyId` but a bumped version (`1.1.0`). Any researcher using `v1.0.0` is unaffected.

### Tracking Lineage (Forking)
Instead of a complex Git-like branching UI, lineage is tracked via a simple `derivedFromPid` column. If a user modifies a public schema and publishes it, the new schema simply records the PID of the original, ensuring proper academic credit.

## 7. Interoperability & FAIR Principles

## 7. Findability & FAIR Principles

To satisfy the **F** (Findable) and **I** (Interoperable) in FAIR, MARKER implements a two-tier discovery architecture:

### Internal Findability (The Explore Page)
MARKER's internal search relies on highly structured metadata rather than just free-text keyword matching:
1. **Domain vs. Keywords**: We use a strict `domain` field (e.g., "Neuroscience", "Linguistics") based on controlled vocabularies (like the OECD Fields of Science) for top-level faceted filtering, reserving `keywords` for hyper-specific tags.
2. **Semantic Ontology Search**: Because `PublishedSchema` supports `ontologyRefs` (e.g., `SNOMED:75367002`), researchers can execute exact semantic searches to find schemas that collect specific data concepts, regardless of what human language the form's title is written in.
3. **Advanced Filtering**: Full support for filtering by `language`, `source` (Native vs. CEDAR), and publication date.

### External Findability (Google Dataset Search)
To ensure schemas are discoverable by the broader internet, the unified export JSON (shown below) is invisibly injected into the `<head>` of the public `schemas/[pid]` detail pages via a `<script type="application/ld+json">` tag. This allows Google Dataset Search and other academic web crawlers to natively index the schemas.

### Licensing (Reusability)
Every `PublishedSchema` must have an explicit license (defaulting to `CC-BY-4.0`) to ensure it is legally reusable by the scientific community.

### Content Negotiation (Accessibility)
The Persistent Identifier (PID) URL for a schema (e.g., `https://marker.stapleverse.org/schemas/ps_8f9a2b`) acts as a smart endpoint:
- **Browser (HTML)**: Returns the MARKER web interface for human readability.
- **API (JSON)**: If requested with `Accept: application/json`, it returns the raw JSON Schema file.

### Unified Export Format (JSON-LD + JSON Schema + uiSchema)
STAPLE currently maps collected form data to standard `schema.org` vocabularies via JSON-LD. MARKER applies this same FAIR philosophy to the form *schemas* themselves, while adhering to the `react-jsonschema-form` (RJSF) standard of separating data validation from UI presentation.

When a schema is exported or downloaded from MARKER, it is packaged into a unified `.json` file containing:
1. **FAIR Metadata**: Provenance and context embedded at the root level using standard Semantic Web vocabularies (Dublin Core, PROV-O).
2. **Data validation (`schema`)**: The pure JSON Schema object (IETF draft-07).
3. **Presentation (`uiSchema`)**: The RJSF layout instructions.

**Example Unified Export:**
```json
{
  "@context": {
    "schema": "https://schema.org/",
    "prov": "http://www.w3.org/ns/prov#"
  },
  "@id": "https://marker.stapleverse.org/schemas/ps_8f9a2b",
  "title": "Cognitive Assessment Template",
  "schema:version": "1.0.0",
  "schema:isVersionOf": "https://marker.stapleverse.org/families/fam_abc",
  "schema:creator": { "name": "Dr. Jane Doe" },
  "schema:license": "https://creativecommons.org/licenses/by/4.0/",
  "prov:wasDerivedFrom": "https://cedar.metadatacenter.org/templates/12345",
  
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "consent_given": {
        "type": "boolean",
        "title": "Patient Consented"
      }
    },
    "required": ["consent_given"]
  },

  "uiSchema": {
    "consent_given": {
      "ui:widget": "switch"
    }
  }
}
```
This architecture ensures 100% interoperability: external validators can ignore the `@context` and `uiSchema` keys and run directly against the `schema` object, while MARKER/STAPLE can instantly reconstruct both the data validation rules and the intended visual UX.

## 8. Application Conventions (MARKER)

These conventions were adopted while building the Forms feature. They apply to every feature module under `features/` and exist to keep the code consistent as the surface area grows.

### 8.1 Feature Module Layout: `actions/` + `queries/`

Each feature exposes its data layer through two server-side folders, each with a barrel (`index.ts`):

- **`features/<feature>/actions/`** — All write paths (Server Actions). Every file carries the `"use server"` directive and is safe to import from client components. There is **no separate `mutations/` folder**; "action" is the single term for a server-side write.
- **`features/<feature>/queries/`** — All read paths and server-only page loaders (e.g. `loadOwnedForm`). These are plain server functions and must **not** be imported into client components.

Consumers import from the barrel, never from deep file paths:

```ts
// Client component
import { deleteForm, publishSchema } from "@/features/forms/actions"
// Server component / page
import { getUserForms, loadOwnedForm } from "@/features/forms/queries"
```

`schemas.ts` (Zod) and `types.ts` (TypeScript) remain client-safe single-file modules and are imported directly.

### 8.2 Client-Facing DTOs (Server → Client Boundary)

Queries that feed client components **must map raw Prisma payloads into flat, serializable DTOs** declared in `types.ts` (e.g. `FormDetailDTO`, `PublishedSchemaSummaryDTO`, `ContributorDTO`). This:

- keeps Prisma internals and unused columns out of the browser bundle,
- gives client components a stable, strongly-typed contract, and
- eliminates `as any` casts when reading `Json` columns (`contributors`, `ontologyRefs`, etc.).

Raw `Prisma.*GetPayload` types stay server-side only.

### 8.3 Shared Page Loaders

Repeated route boilerplate (auth check → id parsing → ownership lookup → `notFound()`) is centralized in a single loader per resource. `loadOwnedForm(idParam)` is the canonical example for owned-form routes (`/collection/[id]`, `.../edit`, `.../publish`). Pages stay declarative and authorization stays in one place.

These loaders use the **read-side** authorization pattern (query-level filtering that collapses any failure to `notFound()`). Write paths use the **write-side** throw-helper instead. The two patterns and when to reach for each are specified in §8.10.

### 8.4 Forms: react-hook-form + Zod is the Standard

All forms use **`react-hook-form` with `zodResolver`**, the shared `components/ui/Form` wrapper, and a Zod schema defined in the feature's `schemas.ts`. Hand-rolled `useState` form state and untyped submit handlers are not used. The same Zod schema validates on the client (resolver) and again on the server (inside `authenticatedAction`); server-side validation failures come back as `fieldErrors` on the typed `ActionResult` and are mapped back onto the form (see §8.9.3–§8.9.6).

### 8.5 Identifiers & Immutability Safety

- **PIDs** are generated with `nanoid` (collision-resistant alphabet) via `utils/id.ts`. Publishing **retries on a PID primary-key collision**, while a `familyId + version` uniqueness clash is surfaced as a friendly "this version already exists" error rather than a raw DB exception.
- The definition of a form's **"latest version" is consistent everywhere**, and that consistency is enforced in **one place**: `features/forms/queries/versionSelectors.ts`. Every read and write path spreads a shared Prisma selector into its `versions` relation arg rather than re-declaring the filter inline:
  - `latestVersionArgs` — the single head version (`where: { archived: false }`, `orderBy: { version: 'desc' }`, `take: 1`). Used by `getUserForms`, `getAuthorizedLatestVersion`, and the `publishSchema` lookup.
  - `nonArchivedVersionsArgs` — the full active history (same filter/order, no `take`). Used by `getFormById` for the detail page.

  This means "latest" provably means the same thing across all callsites, and the rule can be extended (e.g. a future soft-delete column) by editing one file. Previously `getAuthorizedLatestVersion` and `getUserForms` omitted the `archived: false` filter, a latent divergence from this invariant.

### 8.6 Transactional Writes

Any operation that performs more than one dependent write uses `prisma.$transaction([...])` so the database can never be left in a partially-mutated state (e.g. soft-deleting a `Form` and its `FormVersion` rows together, or minting a `PublishedSchema` while locking its `FormVersion`). Single nested `create` calls are already atomic and do not need an explicit transaction.

### 8.7 Component Layering & Client Logic

Components live in one of three layers, chosen by how much they "know". This keeps the eventual `@staple-verse/ui` and `@staple-verse/form-builder` packages cleanly extractable.

| Layer | May know about | Must NOT import | Packageable as |
|---|---|---|---|
| `components/ui/` | props + design tokens only | `features/*`, `next/*` (Link/router), server actions, Prisma/DTO types | `@staple-verse/ui` |
| `features/<f>/components/` | the feature's domain (DTOs, schema/uiSchema); presentational | server actions, `useRouter` (kept thin) | reusable within MARKER/STAPLE |
| route folder (e.g. `collection/[id]/`) | everything — wires hooks, actions, and routes | — | not packageable (page-specific) |

**`ui/` litmus test:** if a component imports `next/link`, `useRouter`, a server action, or a `*DTO` type, it does **not** belong in `components/ui/`.

**Container / Presenter split.** Each route has one "smart" client container that owns state + action wiring (e.g. `UserSchemaDetailsClient`). Everything else is presentational and prop-driven. The detail page was decomposed this way into `features/forms/components/*` (`SchemaStatusBadges`, `SchemaSourceViewer`, `SchemaPreviewPanel`, `SchemaDescriptionCard`) plus route-local composition (`SchemaDetailHeader`, `SchemaViewerCard`, `SchemaDiffDialog`).

**Client logic → hooks.** Server-action wrappers and reused/side-effectful logic are extracted into `features/<f>/hooks/` (e.g. `useCloneForm`, `useVersionSelection`). Trivial local UI state (a single `useState` for an active tab) stays inline — do **not** extract it. Hooks that wrap a server action are the seam where the standardized error/feedback strategy is applied — see §8.9.

**Pending-state idioms.** Use `useTransition` for imperative, button-triggered action calls (gives `isPending` for free, keeps navigation responsive); use `useActionState` for `<form action>` submissions. Avoid hand-rolled `useState(isLoading)` booleans.

### 8.8 Package Boundaries (Shared NPM Packages)

The shared packages have a strict one-way dependency graph:

```
MARKER app ──▶ @staple-verse/form-builder
MARKER app ──▶ @staple-verse/ui
(the two packages do NOT depend on each other)
```

- **`@staple-verse/form-builder` is self-contained** and must **not** import `@staple-verse/ui` components. It currently imports nothing from `components/ui/` — preserve this. A consumer must be able to install the form builder without also pulling in the UI library.
- **Visual consistency comes from the shared Tailwind/DaisyUI theme**, not from sharing React component code across packages. Two visually-identical pieces of chrome on different sides of a package boundary (e.g. the tab strips in `FormStudio` vs. the schema detail page) are **intentionally independent implementations**, not duplication to eliminate.
- **`components/ui/` promotion criterion:** a component graduates into `ui/` only when it is design-system-generic **and** has multiple *app-level* consumers. A use inside `form-builder` does **not** count toward this (it lives on the other side of the boundary). This is why the schema detail tab strip is kept route-local rather than promoted.

### 8.9 Error Handling & User Feedback

This is the **standardized** strategy for surfacing failures and confirmations across the app. It supersedes the ad-hoc `console.error` swallowing that existed in early forms call sites.

#### 8.9.1 Mental model: expected vs. unexpected errors

We follow the Next.js taxonomy (App Router *Error Handling* guide). The axis that decides **where** an error is shown is **expected vs. unexpected**, not "validation vs. action":

- **Expected errors** — validation failures, permission/business-rule violations, "not found", conflicts. These are part of normal operation. They are **modeled as return values, never thrown across the action boundary**, and rendered as explicit UI (inline or toast).
- **Unexpected exceptions** — bugs, infra/DB failures. These are surfaced via **error boundaries** (`error.tsx` / `global-error.tsx`) for render/loader paths. On the action-call path they are normalized to a generic `UNKNOWN` result, logged server-side, and shown as a generic toast — the action layer itself does not leak raw exception text to users.

#### 8.9.2 The four feedback surfaces

| Surface | Used for | Lifetime | Implementation |
|---|---|---|---|
| **Inline field error** | Field-level validation (expected, field-scoped) | Persistent until corrected | `react-hook-form` `setError` / `zodResolver`; rendered next to the input |
| **Inline form-level alert** | Expected errors that **block** the current form and the user must read (e.g. failed login, "this version is already published") | Persistent | `components/ui/Alert` (`alert alert-error`) at the top of the form |
| **Toast** | Success confirmations, and **transient / recoverable** operation errors not tied to a single field | Auto-dismiss (~4s) | `react-hot-toast` engine rendered through a DaisyUI component (§8.9.5) |
| **Error boundary** | Unexpected exceptions during render / data loading | Until retry/navigation | `error.tsx` / `not-found.tsx` / `global-error.tsx` with `unstable_retry` (§8.9.7) |

Rule of thumb: **field validation → inline field**; **blocking expected error → inline alert**; **success or transient failure → toast**; **unexpected during render → error boundary**.

#### 8.9.3 The action contract: typed result envelope (Option B)

Server actions **do not throw for expected errors**. Every action returns a discriminated-union `ActionResult` so a single call can carry both field errors (for inline display) and a top-level message (for a toast/alert). This is the long-term contract for all of `features/<feature>/actions/`.

```ts
// utils/action-result.ts
export type ActionErrorCode =
  | "VALIDATION"    // input failed Zod; carries fieldErrors
  | "UNAUTHORIZED"  // not signed in
  | "FORBIDDEN"     // signed in but not allowed
  | "NOT_FOUND"
  | "CONFLICT"      // e.g. version already exists, optimistic-lock clash
  | "UNKNOWN";      // unexpected; generic message, logged server-side

export type FieldErrors<TInput> = Partial<Record<keyof TInput, string[]>>;

export type ActionResult<TData, TInput = unknown> =
  | { ok: true; data: TData }
  | {
      ok: false;
      code: ActionErrorCode;
      error: string;                 // user-safe, human-readable summary
      fieldErrors?: FieldErrors<TInput>;
    };

// Thrown *inside* handlers/helpers to signal an expected error with a code.
// Anything that is NOT an ActionError is treated as unexpected (UNKNOWN).
export class ActionError extends Error {
  constructor(public code: ActionErrorCode, message: string) {
    super(message);
    this.name = "ActionError";
  }
}
```

#### 8.9.4 `authenticatedAction` returns the envelope

The wrapper (`utils/safe-action.ts`) is the single place that turns auth checks, Zod validation, and thrown `ActionError`s into the envelope. Handlers stay focused on business logic and may `throw new ActionError(...)` for expected failures; truly unexpected throws are caught, logged, and collapsed to `UNKNOWN` (never surfacing internal detail).

```ts
// utils/safe-action.ts
export function authenticatedAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (args: { input: TInput; userId: number }) => Promise<TOutput>,
) {
  return async (input: unknown): Promise<ActionResult<TOutput, TInput>> => {
    try {
      const { userId } = await requireAuth(); // throws -> caught -> UNAUTHORIZED

      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        return {
          ok: false,
          code: "VALIDATION",
          error: "Please fix the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors<TInput>,
        };
      }

      const data = await handler({ input: parsed.data, userId });
      return { ok: true, data };
    } catch (e) {
      return normalizeActionError(e); // ActionError -> its code+message; else log + UNKNOWN
    }
  };
}
```

- Authorization helpers (e.g. `getAuthorizedLatestVersion`) throw **`ActionError`** with the right code (`FORBIDDEN`, `NOT_FOUND`, …) instead of bare `Error`, so their messages reach the user safely.
- `normalizeActionError` maps `ActionError` → `{ ok: false, code, error: e.message }`; everything else is `console.error`-logged (server) and returned as `{ ok: false, code: "UNKNOWN", error: "Something went wrong. Please try again." }`.
- This aligns the forms actions with the auth actions (`features/auth/actions.ts`), which already return `{ error }`. Auth should migrate to the same `ActionResult` shape over time.

#### 8.9.5 Toast infrastructure (DaisyUI-styled, shared-ready)

We use **`react-hot-toast` as a headless engine** but render every toast through our **own DaisyUI component**, so styling matches the design system and the visual piece is promotable to `@staple-verse/ui` (and reusable by STAPLE, which already uses `react-hot-toast`).

- **`components/ui/Toast.tsx`** — presentational, prop-only. Renders a DaisyUI `alert alert-{variant}` (+ Heroicon) from the toast's `type`/`message`. Shares the visual language of `components/ui/Alert.tsx`. Packageable as `@staple-verse/ui`.
- **`components/ui/Toaster.tsx`** — `"use client"`. Mounts `react-hot-toast`'s `<Toaster>` and uses its **render-prop** (`{(t) => <Toast t={t} />}`) so even plain `toast.success()/error()` calls render with our DaisyUI component globally.
- **Mount point** — once in `app/layout.tsx` (root layout, inside `<body>`). Mounting at the root — not in a nested layout — ensures auth/public pages also get toasts (STAPLE's mistake was mounting only in its inner `Layout`).
- **`lib/toast.ts`** — re-exports `toast` and a thin `useToast()` (`{ success, error, promise }`). Call sites import from `@/lib/toast`, **never** from `react-hot-toast` directly, so the engine can be swapped from one place.

> Layering note (§8.7/§8.8): `Toast`/`Toaster` are design-system-generic and belong in `components/ui/`; the `lib/toast` wrapper, the `ActionResult` contract, and error normalization are **app-level** and must not be pulled into `@staple-verse/ui`. `react-hot-toast@^2.6` is React 19 compatible.

#### 8.9.6 The call-site seam: action-wrapper hooks

Hooks in `features/<f>/hooks/` that wrap an action remain the **single seam** where results are turned into feedback. With the envelope there is no `try/catch` for expected errors — the hook branches on `res.ok`:

```ts
// features/forms/hooks/useCloneForm.ts (shape)
const clone = (versionId: number) =>
  startCloning(async () => {
    const res = await cloneFormVersion({ versionId });
    if (!res.ok) {
      toast.error(res.error);          // transient operation error -> toast
      return;
    }
    toast.success("Form cloned");      // success -> toast
    router.push(`/collection/${res.data}`);
  });
```

For **form** submissions, the same envelope feeds both surfaces: top-level `error` → toast or form alert, and `fieldErrors` → mapped back into `react-hook-form` so they appear inline:

```ts
const res = await saveFormVersion(values);
if (!res.ok) {
  if (res.fieldErrors) applyFieldErrors(form, res.fieldErrors); // -> setError per field
  else toast.error(res.error);
  return;
}
toast.success("Saved");
```

Conventions:
- Every imperative action call goes through a `use*` hook; no action is `await`ed inline in a route component (`createForm`, `deleteForm`, `saveFormVersion`, `createFormCheckpoint`, `publishSchema` each get a hook).
- Pending state comes from `useTransition` (§8.7), not hand-rolled `useState(isLoading)`.
- Success is **always** confirmed (toast or redirect-with-feedback). The publish flow surfaces success on redirect rather than silently relying on the `?published=` param. Form Studio save/checkpoint navigation semantics are specified separately in §8.11.
- `console.error` is no longer a user-facing strategy; it is only acceptable as server-side logging inside `normalizeActionError`.

#### 8.9.7 Error boundaries (render / data-loading path)

The `ActionResult` envelope + toasts cover the **action-call** path. Failures during **render or server-side data loading** (a page loader throwing, a DB outage, a bug in DTO mapping) never reach a call site, so they are caught by Next.js **error boundaries** instead. These are the concrete files:

| File | Catches | Notes |
|---|---|---|
| `app/(authenticated)/error.tsx` | Unexpected throws from any authenticated page/loader (collection, dashboard, profile, notifications) | `"use client"`; rendered **inside** `(authenticated)/layout.tsx`, so the navbar stays. Reuses `Alert` + `Button`; logs `error.digest`; offers retry. Does **not** catch errors in the authenticated layout itself. |
| `app/(authenticated)/not-found.tsx` | `notFound()` — most often `loadOwnedForm` for an invalid id / missing / not-owned form | Branded 404; server component. |
| `app/(authenticated)/loading.tsx` | — | Suspense fallback (spinner) for async server pages. Polish, not error handling. |
| `app/global-error.tsx` | Failures in the **root layout** itself (which the group boundary cannot catch) | `"use client"`; replaces the root layout, so it renders its own `<html>`/`<body>`, imports `globals.css`, and has **no `<Toaster>`**. Last line of defense. |

Conventions:
- **Recovery uses `unstable_retry()`** (the Next ≥16.2 prop), not `reset()` — it re-fetches and re-renders the boundary's children. Boundary signature is `{ error: Error & { digest?: string }; unstable_retry: () => void }`.
- **Boundaries are placed at the route-group level**, not per-page, so one file covers all siblings with consistent chrome. Add a deeper `error.tsx`/`not-found.tsx` only when a segment needs bespoke recovery.
- Server Component errors arrive in production with a generic message + `digest`; **log the `digest`** to correlate with server logs (raw messages are not shown to users).
- The `(public)` group currently relies on Next's defaults; add boundaries there if/when public routes need branded failure/404 states.

#### 8.9.8 Accessibility

Inline alerts and field errors use `role="alert"` / `aria-live` and are the primary channel for anything the user **must** act on. Toasts are treated as **non-essential, supplementary** feedback (they auto-dismiss and can be missed), so a blocking error is never *only* a toast.

### 8.10 Server-side Authorization Pattern

There are two ways to enforce ownership/tenancy on the server, and they are **assigned by layer** rather than chosen ad-hoc. Both are legitimate; mixing them within a layer was the inconsistency this section resolves.

| | Read-side: query-level filtering | Write-side: throw-helper |
|---|---|---|
| **Examples** | `getFormById`, `getUserForms` (via `loadOwnedForm`) | `getAuthorizedLatestVersion` |
| **Mechanism** | Ownership/tenancy as Prisma `where` clauses (`userId`, `app: "marker"`, `archived: false`) | Fetch by id, then sequential guard clauses |
| **Failure shape** | Returns `null` / `[]`; the page calls `notFound()` | Throws a coded `ActionError` (caught by `authenticatedAction`, §8.9.4) |
| **Granularity** | All failures collapse to one outcome (not-found) | Distinguishes `NOT_FOUND`, `FORBIDDEN`, `CONFLICT` |
| **Return type** | Mapped DTO (§8.2) | Raw Prisma payload (consumed server-side only) |

**Which to use:**
- **Reads / page renders → query-level filtering.** Pages only need "render or `notFound()`", and collapsing every failure avoids leaking resource existence on list/detail surfaces.
- **Writes / Server Actions → the throw-helper.** Actions return the `ActionResult` envelope and genuinely benefit from coded errors (e.g. `CONFLICT` on an archived/published form). `getAuthorizedLatestVersion` is the **single authorizer for owned-form mutations** — `saveFormVersion`, `createFormCheckpoint`, `deleteForm`, and `publishSchema` all route ownership through it. New write actions should call it rather than re-deriving ownership inline. Its messages are intentionally **action-neutral** ("Cannot modify an archived form", "You do not have permission to modify this form") so every caller can reuse them; action-specific guards (e.g. `publishSchema`'s already-`PUBLISHED` check) stay in the action.

**Existence-disclosure policy (decided).** When a form exists but is owned by another user, the write-side helper returns **`FORBIDDEN`, not `NOT_FOUND`** — a deliberate, granular choice. Its only callers are authenticated owners operating on their own forms through the UI, so the better error message outweighs the minor trade-off of confirming an id exists to a non-owner. Read-side queries take the opposite stance (collapse to not-found) because list/anonymous surfaces must not disclose existence. This asymmetry is intentional; the decision lives **only** in `getAuthorizedLatestVersion` so it can't drift.

#### 8.10.1 Still deferred

These remain open and are **not** yet standardized:
- **Returning a DTO (rather than raw Prisma) from the throw-helper**, to bring it in line with the §8.2 boundary rule. Low priority while its consumers are server-only.
- **Deeper JSON-Schema (draft-07) input validation on save.**

### 8.11 Form Studio Editing: DB Truth & Recovery Buffer

Form editing in MARKER can span long sessions. Users need protection against data loss (browser crash, accidental tab close) **without** writing to the database on every keystroke. This section defines the **precedence contract** between the database, the browser recovery buffer, and the editor UI. All form-editing code (`useFormDraft`, `useSaveForm`, `SchemaEditClient`, `FormStudio`) must follow it.

#### 8.11.1 Two stores, one truth

| Store | Role | Written by | Read by |
|---|---|---|---|
| **Database** (`FormVersion.schema` / `uiSchema`) | **Sole source of truth** | Explicit user actions only (`saveFormVersion`, `createFormCheckpoint`, `publishSchema`) | Detail page, publish, clone, edit page load |
| **localStorage** (`marker-form-draft-${formId}-${versionId}`) | **Transient recovery buffer** | Debounced autosave (~1.5s after last change) while the editor is dirty | Restore prompt on next edit-session load only |

Nothing downstream of the editor (publish, clone, collection list, detail view) ever reads localStorage. The buffer exists solely so unsaved edits survive a crash or refresh.

#### 8.11.2 Precedence rules

1. **The DB is always the source of truth.** It is what renders on load, what publish/clone/detail read, and the only state that counts as "saved."
2. **localStorage is never a save.** It is a silent crash-recovery cache. The UI must not label a buffer write as "saved."
3. **The buffer is dirty-only and version-scoped.** Write to localStorage only when the editor differs from the loaded DB baseline. If the editor matches the baseline, delete the buffer entry. The key includes both `formId` and `versionId`; the payload records `baseVersionId` (the DB head the buffer was based on).
4. **A buffer is restorable only when it matches the current DB head.** On load, offer "Restore draft" only if a buffer exists, differs from the DB baseline, and `baseVersionId === version.id`. Otherwise treat it as stale (discard silently or warn — never apply it onto a different version).
5. **Any successful DB write clears the buffer** for that form/version (`saveFormVersion`, `createFormCheckpoint`, `publishSchema`).
6. **The save-status indicator reflects DB sync only** — not buffer writes. States: `Unsaved changes` (editor ≠ last DB save) → `Saving…` (DB write in flight) → `All changes saved` (editor = DB). The word "locally" does not appear in save-status copy.
7. **Save Changes does not navigate.** `saveFormVersion` (in-place overwrite of the latest draft) keeps the user in the editor. On success: update the DB baseline ref, clear the buffer, toast confirmation, pill → "All changes saved."
8. **Done finishes the session.** If the editor is synced with the DB, **Done** navigates immediately to `/collection/[id]`. If dirty, **Done** calls `saveFormVersion` first, then navigates on success. **Done** is always enabled (except while a save is in flight).
9. **Back to Schema** is the leave-without-saving path. When dirty, confirm and clear the recovery buffer on OK before navigating. When synced, navigate immediately.
10. **Version creation happens on the detail page only.** The editor does **not** expose "Save as New Version". The **+** control in `VersionHistorySidebar` creates a new `FormVersion` row as a **copy of the latest non-archived head** (never an empty schema), then opens `/collection/[id]/edit`.

#### 8.11.3 Write cadence (what hits the DB vs the buffer)

| Trigger | Target | Navigates away? |
|---|---|---|
| Debounced autosave (~1.5s while dirty) | localStorage buffer only | No |
| **Save Changes** (`saveFormVersion`) | DB — overwrites latest draft in place | No |
| **Done** | DB if dirty (`saveFormVersion`), then detail page; immediate navigate if synced | Yes → `/collection/[id]` |
| **Back to Schema** | None (discards buffer if user confirms leave while dirty) | Yes → `/collection/[id]` |
| **+ New version** (sidebar on detail page) | DB — new row copied from latest head | Yes → `/collection/[id]/edit` |
| **Publish** (`publishSchema`) | DB — immutable `PublishedSchema` | Yes (publish flow) |

Autosave frequency must **not** be retargeted at the database. Long editing sessions rely on the buffer for crash protection; the DB is updated only on explicit user intent.

#### 8.11.4 Save-status ownership (`FormStudio` boundary)

`@staple-verse/form-builder` is app-agnostic (§8.8) and must not reference "database" or MARKER-specific persistence. Therefore:

- The **route layer** (`SchemaEditClient` + hooks) owns `saveState` by comparing live editor state to a `lastDbSavedRef` baseline seeded from the loaded `FormVersion`.
- `FormStudio` receives save state as a prop (or the status pill is rendered in the route, outside the package). Neutral copy only: "Unsaved changes" / "Saving…" / "All changes saved."
- **In-flight DB saves** (`isSaving` from `useTransition` in `useSaveForm`) set `saveStatus` to `"saving"` on the pill (spinner + "Saving…"). Header actions (**Save Changes**, **Done**, **Back to Schema**) disable for the duration. Do **not** use a full-card blocking overlay — the pill and disabled buttons are sufficient feedback; the editor stays readable during the request.
- The debounced buffer write inside `onAutoSave` is a **silent side effect** with no status pill of its own. Optional subordinate copy (e.g. a tooltip: "Backed up in browser · not yet saved to your collection") may appear only when dirty and must not compete with the DB-sync indicator.

#### 8.11.5 Navigation guards

Because edits can live in the buffer while the DB is stale, the editor must warn before the user leaves with unsaved DB changes:

- **`beforeunload`** when the editor is dirty relative to the last DB save.
- **In-app route-change guard** (same dirty check) when navigating via **Back to Schema** or external links.

This closes the gap where a user edits, assumes work is safe because the buffer captured it, leaves without clicking Save Changes, and later publish/clone reads stale DB content.

#### 8.11.5.1 Optimistic concurrency (`formVersionId` + `updatedAt`)

`saveFormVersion` and `publishSchema` must receive **`formVersionId`** (the head the client loaded) and **`expectedUpdatedAt`** (ISO timestamp from that load). The server:

1. Performs the normal authorization check, then starts a transaction and locks the parent `Form` row with `SELECT ... FOR UPDATE`.
2. Re-authorizes and reloads the latest version while holding that lock. All head-sensitive writes (`saveFormVersion`, `publishSchema`, and version creation) use this same lock.
3. Rejects with **`CONFLICT`** if `formVersionId !== latestVersion.id` (head moved — e.g. **+ New version** in another tab).
4. Applies writes with **`updateMany`** conditioned on `id`, `formId`, and `updatedAt === expectedUpdatedAt` so concurrent edits to the **same head** also return **`CONFLICT`** instead of last-write-wins.

On successful `saveFormVersion`, return the new **`updatedAt`** ISO string so the client updates its baseline for the next save. `FormVersion.updatedAt` is maintained by Prisma `@updatedAt`.

#### 8.11.6 Restore flow

When a valid buffer is detected on edit-page load, show an info alert with **Restore** / **Discard**. Restore copies buffer content into editor state and bumps `studioKey` to remount `FormStudioProvider` with the recovered props — the existing remount pattern is retained. Discard removes the buffer entry.

#### 8.11.7 Editor vs detail: action split

The editor and detail page have distinct responsibilities. Do not duplicate version-creation actions in the editor.

```
During edit (/collection/[id]/edit):
  Save Changes        → overwrite latest head, stay in editor
  Done                → save if dirty, then return to detail; navigate immediately if synced
  Back to Schema      → leave (confirm + discard buffer if dirty)

From detail (/collection/[id]):
  Edit Structure      → open editor on latest head
  + (sidebar)         → copy latest → new FormVersion row → open editor
  Restore (older)     → copy selected historical version → new FormVersion row → open editor
```

**Save Changes** is for frequent, low-ceremony persistence during a long session. **Done** is the primary finish action. **+ New version** on the detail page copies the latest head (`createFormVersionFromLatest`), while **Restore as New Draft** copies the selected historical version into a new head without rewriting history. The `createFormCheckpoint` action remains in the codebase for potential future flows but is not exposed in the editor UI.

Version-history selection is URL state, not component-local state. `/collection/[id]`
shows the latest version; `/collection/[id]?version=[formVersionId]` shows a
historical version. Invalid IDs redirect to the canonical latest-version URL.
