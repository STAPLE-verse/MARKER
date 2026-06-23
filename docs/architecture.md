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

### 8.4 Forms: react-hook-form + Zod is the Standard

All forms use **`react-hook-form` with `zodResolver`**, the shared `components/ui/Form` wrapper, and a Zod schema defined in the feature's `schemas.ts`. Hand-rolled `useState` form state and untyped submit handlers are not used. The same Zod schema validates on the client (resolver) and again on the server (inside `authenticatedAction`); server-side validation failures come back as `fieldErrors` on the typed `ActionResult` and are mapped back onto the form (see §8.9.3–§8.9.6).

### 8.5 Identifiers & Immutability Safety

- **PIDs** are generated with `nanoid` (collision-resistant alphabet) via `utils/id.ts`. Publishing **retries on a PID primary-key collision**, while a `familyId + version` uniqueness clash is surfaced as a friendly "this version already exists" error rather than a raw DB exception.
- The definition of a form's **"latest version" is consistent everywhere**: queries and the publish action all filter `versions` by `archived: false` and order by `version desc`.

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

**Container / Presenter split.** Each route has one "smart" client container that owns state + action wiring (e.g. `UserSchemaDetailsClient`). Everything else is presentational and prop-driven. The detail page was decomposed this way into `features/forms/components/*` (`SchemaStatusBadges`, `SchemaSourceViewer`, `SchemaPreviewPanel`, `SchemaDescriptionCard`, `OlderVersionBanner`) plus route-local composition (`SchemaDetailHeader`, `SchemaViewerCard`).

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
| **Error boundary** | Unexpected exceptions during render / data loading | Until retry/navigation | `app/**/error.tsx`, `app/global-error.tsx` with `unstable_retry` |

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
- Success is **always** confirmed (toast or redirect-with-feedback). The publish flow surfaces success on redirect rather than silently relying on the `?published=` param.
- `console.error` is no longer a user-facing strategy; it is only acceptable as server-side logging inside `normalizeActionError`.

#### 8.9.7 Accessibility

Inline alerts and field errors use `role="alert"` / `aria-live` and are the primary channel for anything the user **must** act on. Toasts are treated as **non-essential, supplementary** feedback (they auto-dismiss and can be missed), so a blocking error is never *only* a toast.

### 8.10 Deferred Decisions

The following were explicitly deferred for separate discussion and are **not** yet standardized: the long-term server-side authorization pattern (query-level filtering vs. the `getAuthorizedLatestVersion` throw-helper — note it will throw typed `ActionError`s per §8.9.4 regardless), and deeper JSON-Schema (draft-07) input validation on save.
