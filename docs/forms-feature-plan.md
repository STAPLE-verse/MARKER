# Forms Feature — Vertical Deployment Plan

> **Goal:** Build out the complete Forms lifecycle in MARKER — from creating a draft form through the visual builder, to versioning, publishing to the marketplace, and browsing/forking published schemas. This is the core feature of MARKER.

### The Core Workflow

To maintain a clean user experience, MARKER separates the structural creation of a form from the academic publication of that form:

1. **The Draft Phase (Ingestion):** A user creates a draft by building it from scratch in the `FormBuilder` or importing it from STAPLE or an external catalog such as CEDAR. At this stage, it is a private, mutable `Form`. The `FormBuilder` is used strictly for editing the structure (`schema` and `uiSchema`).
2. **The Publish Phase (The Freeze):** When ready, the user clicks "Publish". This triggers a **Publication Wizard** that collects all FAIR academic metadata (Domain, Language, Contributors, License, Release Notes). Upon submission, an immutable `PublishedSchema` with a PID is minted.

> **Product Identity Note (The Metadata Librarian):** MARKER acts as a **Zotero for metadata schemas** (a curated private collection) and a **Zenodo for metadata** (a public archive). It is not a mirror of STAPLE. Users deliberately bring schemas into MARKER. To support this, `Form` records will be scoped by an `app` field (`"staple"` vs `"marker"`), and imports from STAPLE will create independent copies, not links.

---

## 1. Current State Audit

### ✅ What We Have

| Layer                  | Asset                                                                                                                                               | Status                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Form Builder UI**    | `@staple-verse/form-studio` GitHub package                                                                                                          | Working. Shared visual builder, JSON editor, and live preview used by MARKER and STAPLE.                                        |
| **FormStudio Context** | `FormStudioProvider` and `useFormStudio` package exports                                                                                            | Working. Shared state for schema, uiSchema, and formData.                                                                        |
| **Exports**            | `@staple-verse/form-studio` public API                                                                                                               | Components, provider, hooks, integration state, and builder types are imported from the package.                               |
| **App Routes**         | `collection/` list, `collection/new`, `collection/[id]`, `collection/[id]/edit`                                                                     | Scaffolded with **mock data only**. No server actions, no DB reads.                                                              |
| **Public Routes**      | `(public)/explore/`, `(public)/schemas/`                                                                                                            | Directories exist (content not yet wired to real data).                                                                          |
| **Prisma Schema**      | `Form`, `FormVersion`, `PublishedSchema` models                                                                                                     | Defined and ready. `Form` → `FormVersion` (1:N), `PublishedSchema` standalone with PID, familyId, version.                       |
| **UI Components**      | `components/ui/` — Button, Card, Input, Modal, Table, PageHeader, etc.                                                                              | Production-ready, used across existing pages.                                                                                    |
| **Auth**               | `features/auth/` — actions, schemas, components                                                                                                     | Working. Auth guard in `(authenticated)/layout.tsx`.                                                                             |
| **Dependencies**       | `@staple-verse/form-studio`, `@monaco-editor/react`, `react-hook-form`, `zod`, `@tanstack/react-table`                                              | Shared builder dependencies are owned by Form Studio; MARKER retains direct dependencies used elsewhere.                       |

### ❌ What's Missing (The Work)

| Gap                          | Description                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Server Actions for Forms** | No `features/forms/actions.ts` exists. All CRUD is mock.                                                           |
| **DB Queries**               | No `features/forms/queries.ts`. Collection page uses hardcoded arrays.                                             |
| **Form ↔ DB Wiring**         | Edit page (`collection/[id]/edit`) uses local `useState("{}")` — doesn't load or save to the database.             |
| **Versioning Logic**         | FormVersion table is defined but no code creates/bumps versions.                                                   |
| **Publish Flow**             | Publish modal exists as UI only. No server action to freeze a FormVersion into a `PublishedSchema` row with a PID. |
| **Import from STAPLE**       | The source-specific add route is not implemented. Need to query `Form` + `FormVersion` from the shared DB.         |
| **Explore/Browse**           | Public explore page likely mock or empty. Needs search, filtering, schema detail pages.                            |
| **Folders**                  | `Folder` model exists in Prisma. No UI for organizing forms into folders.                                          |
| **Form Tags**                | `Form.tags` (JSON) exists but no UI for tagging.                                                                   |
| **Forking/Derivation**       | `PublishedSchema.derivedFromPid` is in the schema. No fork flow exists.                                            |
| **Content Negotiation**      | Architecture doc describes `Accept: application/json` for PID URLs. Not implemented.                               |
| **JSON-LD Export**           | Architecture doc describes embedded `@context`. Not implemented.                                                   |
| **Validation**               | No Zod schemas for form creation / version metadata.                                                               |

### Open Architecture Questions

> **Resolved (2026-07-28):** Cross-app import is bidirectional and allows **draft** versions as well as published tips. Each import copies one specific version; the user chooses **create new form** or **update parent form** (when provenance exists). Updates append a new version with the imported snapshot — no diff/merge/gate. Draft MARKER→STAPLE export must be clearly labeled as not a `PublishedSchema`. Full spec: [`refactor/import.md`](./refactor/import.md).

---

## 2. Data Model Recap

The Prisma schema already defines the three core tables. Here's the lifecycle they map to:

```
Create Form (Form row)
    └──> Draft Version (FormVersion v1)
            └──> Edit in FormStudio (update FormVersion.schema)
                    ├──> Save New Version? → FormVersion v2, v3...
                    └──> Publish? → PublishedSchema (immutable, PID assigned)
                                        └──> Fork? → New Form (derivedFromPid set)
```

### Key Relationships

- **User → Form** (1:N) — a user owns many draft forms
- **Form → FormVersion** (1:N) — a form has many versions, each storing a `schema` (JSON) and optional `uiSchema` (JSON)
- **Form → Folder** (N:1, optional) — forms can be organized into user-owned folders
- **User → PublishedSchema** (1:N) — published, immutable schemas with PIDs
- **PublishedSchema.familyId** groups versions of the same published schema
- **PublishedSchema.derivedFromPid** tracks forking lineage

### What's NOT in the Schema Yet (Decision Needed)

| Item                         | Question                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Draft name & description** | **Resolved:** We will read `name` from `FormVersion.name` and `description` from the parsed JSON schema, mirroring STAPLE's current behavior. Denormalizing to the top-level `Form` model now would break STAPLE's production write mutations. <br><br>_(Future Tech Debt Note: If JSON-parsing slows down collection queries significantly as the app scales, we should denormalize these fields. This will require a coordinated refactor of STAPLE's `createForm` and `updateFormVersion` logic)._ |
| **Stats & Social**           | We need `viewCount`, `usageCount` (downloads/forks), and an explicit `endorsementCount` on `PublishedSchema`. We also need a way to track which users endorsed which schemas (e.g., a `SchemaEndorsement` join table).                                                                                                                                                                                                                                                                                |

---

## 3. Feature Module Architecture

Following the vertical slicing pattern in `features/README.md`, `features/forms/` owns the
MARKER-specific data layer (server actions, queries, validation). The shared UI builder is
provided by `@staple-verse/form-studio`.

```
features/
├── form-builder/          # UI-only: FormStudio, FormBuilder, JsonEditor, etc.
│   └── (existing, no changes needed for Phase 1)
│
├── forms/                 # NEW: Data layer for form lifecycle
│   ├── actions.ts         # Server Actions (create, save, version, publish, delete, import)
│   ├── queries.ts         # DB read queries (getUserForms, getFormById, getFormVersions, etc.)
│   ├── schemas.ts         # Zod validation schemas
│   └── types.ts           # TS types for form lifecycle (FormWithVersions, etc.)
│
└── auth/                  # Existing
```

### Server Actions Needed

| Action             | Input                                                                                                         | Behavior                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `createForm`       | `{ title, description, version?, license? }`                                                                  | Creates `Form` + first `FormVersion` (v1, empty schema). Returns the new form ID.                                                            |
| `saveFormVersion`  | `{ formId, schema, uiSchema }`                                                                                | Updates the **latest** `FormVersion`'s schema/uiSchema JSON in-place (auto-save while editing).                                              |
| `createNewVersion` | `{ formId, schema, uiSchema, name? }`                                                                         | Creates a new `FormVersion` row with bumped version number. For explicit "Save as new version" action.                                       |
| `archiveForm`      | `{ formId }`                                                                                                  | Soft-archive (set `archived: true`) on the `MarkerForm` and cascade to all `MarkerFormVersion` rows.                                              |
| `publishSchema`    | `{ formVersionId, keywords[], license, domain, language, contributors, releaseNotes, relatedPublicationDoi }` | Freezes a `FormVersion` into a `PublishedSchema`. Extracts nested `ontologyId`s from JSON. Generates PID, familyId, sets `version`.          |
| `forkSchema`       | `{ publishedSchemaPid }`                                                                                      | Creates a new `Form` + `FormVersion` pre-populated with the published schema's JSON. Sets `derivedFromPid`.                                  |
| `importFromStaple` | `{ sourceFormId, sourceVersionId, mode, targetMarkerFormId? }` | Copy one STAPLE version into MARKER (`create` new form or `update` parent). See [`refactor/import.md`](./refactor/import.md). |
| `endorseSchema`    | `{ publishedSchemaPid }`                                                                                      | Toggles the user's endorsement (like) for a schema. Updates join table and increments/decrements `endorsementCount`.                         |

### Queries Needed

| Query                                    | Returns                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getUserForms(userId)`                   | All non-archived `Form` rows for the user where `app == "marker"`, including latest `FormVersion` name + version number (for collection list).                     |
| `getFormById(formId)`                    | Single `Form` with all `FormVersion` rows (for detail page).                                                                                                       |
| `getFormVersion(formVersionId)`          | Single `FormVersion` with full `schema` + `uiSchema` JSON (for editor).                                                                                            |
| `getUserPublishedSchemas(userId)`        | All `PublishedSchema` rows authored by the user.                                                                                                                   |
| `getUserEndorsedSchemas(userId)`         | All `PublishedSchema` rows that the user has endorsed via the `SchemaEndorsement` join table.                                                                      |
| `getPublishedSchema(pid)`                | Single `PublishedSchema` by PID (for public detail page).                                                                                                          |
| `searchPublishedSchemas(query, filters)` | Full-text search over `title`, `description`, `keywords`, `contributors`. Filters by `domain`, `language`, `ontologyId`. Sorts by `usageCount`/`endorsementCount`. |

---

## 4. Route-by-Route Implementation Plan

### 4.1 Collection List — `/collection`

**Current:** Client component with hardcoded `mockUserSchemas` array.

**Target:**

- Convert to **Server Component** (or hybrid with server data fetch).
- Call `getUserForms(session.user.id)` to populate the table.
- Also call `getUserPublishedSchemas(session.user.id)` and merge/tag rows.
- Add an "Endorsed Schemas" tab/view that calls `getUserEndorsedSchemas(session.user.id)`.
- Wire the Archive button to `archiveForm` server action.
- Add folder sidebar (Phase 3+).

### 4.2 Create Form — `/collection/new`

**Current:** Native creation is implemented at this route.

**Target — add-method chooser:**

- Render equal cards for native creation, STAPLE import, and planned external API integrations.
- Navigate each card to a dedicated subroute; do not use tabs or treat native creation as an import.

**Target — `/collection/new/blank`:**

- Relocate the existing native form without changing its `createForm` action.
- On success, redirect to `/collection/{newFormId}/edit`.

**Target — `/collection/new/staple`:**

- List the user’s STAPLE forms + selectable versions; on import, choose **create new** or **update parent** (when provenance exists). See [`refactor/import.md`](./refactor/import.md).
- Redirect to the MARKER form detail/edit page.

**Target — external API routes:**

- Add one route and server adapter per supported external catalog.
- Reuse the normalized snapshot and persistence infrastructure in [`refactor/import.md`](./refactor/import.md).

### 4.3 Form Detail — `/collection/[id]`

**Current:** Mock schema detail with hardcoded JSON.

**Target:**

- Server Component: call `getFormById(id)` with auth guard (verify ownership).
- Display all versions in a version history list.
- Show the selected version's JSON (or default to latest).
- Wire "Publish Schema" button to `publishSchema` action.
- Wire "Edit Builder" link to `/collection/[id]/edit?version={versionId}`.

### 4.4 Form Editor — `/collection/[id]/edit`

**Current:** `FormStudio` with empty initial schema (`"{}"`), save goes nowhere.

**Target:**

- Load existing `FormVersion.schema` and `FormVersion.uiSchema` from DB on mount.
- Pass as `initialSchema` / `initialUiSchema` to `FormStudio`.
- Wire `onSave` to call `saveFormVersion` server action.
- Add auto-save (debounced) or explicit save with toast confirmation.
- Add "Save as New Version" button calling `createNewVersion`.

### 4.5 Explore — `(public)/explore`

**Target:**

- Public page (no auth required).
- Search bar + keyword filter + source filter (native / cedar / redcap).
- Call `searchPublishedSchemas` query.
- Display results as cards with title, description, version, author, keywords.

### 4.6 Public Schema Detail — `(public)/schemas/[pid]`

**Target:**

- Server Component: call `getPublishedSchema(pid)`.
- Display full schema metadata, JSON preview, license, lineage.
- "Fork This Schema" button (requires auth → redirect to login if needed, then call `forkSchema`).
- Content negotiation: if `Accept: application/json`, return raw JSON (API route or middleware).

---

## 5. Implementation Phases

### Phase 1: Wire the Draft Lifecycle (Core CRUD)

> **Goal:** A user can create, save, load, and delete draft forms with real DB persistence.

- [x] Create `features/forms/schemas.ts` — Zod schemas for form creation input
- [x] Create `features/forms/actions.ts` — `createForm`, `saveFormVersion`, `archiveForm`
- [x] Create `features/forms/queries.ts` — `getUserForms`, `getFormById`, `getFormVersion`
- [x] Create `features/forms/types.ts` — TypeScript types for query returns
- [x] Refactor `/collection` page → server data fetch with `getUserForms`
- [x] Wire native schema creation → `createForm` + redirect
- [x] Wire `/collection/[id]` → `getFormById` with ownership check
- [x] Wire `/collection/[id]/edit` → load `FormVersion` schema, save via `saveFormVersion`
- [x] Wire Delete action on collection page

**Deliverable:** User can create a form, open it in FormStudio, build fields, save, come back later and continue editing. Collection page shows real forms from the database.

### Phase 2: Versioning + Publish

> **Goal:** A user can create explicit versions, publish an immutable schema to the marketplace.

- [x] Implement `createNewVersion` action (version bumping logic)
- [x] Add version history UI on `/collection/[id]` detail page
- [x] Build the "Publication Wizard" Modal (collects FAIR metadata: domain, language, contributors, license, release notes)
- [x] Update FormBuilder UI (`CardGeneralParameterInputs.tsx`, `types.ts`) to add an `ontologyId` input to specific field properties.
- [x] Implement `publishSchema` action (extracts nested `ontologyId`s to populate `PublishedSchema.ontologyRefs`, generates PID, immutability)
- [x] Wire the publish modal to trigger from the draft detail page (keeping FormBuilder strictly for structural editing)
- [x] Refactor detail page to show draft vs. published status from real data

**Deliverable:** User can save named versions, compare them, and publish a frozen schema with a PID.

### Phase 3: Import and Explore

> **Goal:** Native creation and the first import paths work. Public explore page is functional.

- [ ] Wire cross-app version import (STAPLE ↔ MARKER): create-new vs update-parent — see [`refactor/import.md`](./refactor/import.md)
- [ ] Add shared import normalization, hashing, provenance, and persistence infrastructure
- [ ] Add external catalog adapters as their APIs are selected and designed
- [ ] Build out `(public)/explore` page with advanced search + filters (Publication Date, Domain/Subject, Ontology Codes)
- [ ] Build out `(public)/schemas/[pid]` detail page
- [ ] Implement `forkSchema` action
- [ ] Add content negotiation for schema PID URLs (middleware or route handler)
- [ ] Add UI badges for imported/forked schemas indicating if they are an "Unmodified Translation" vs a "Modified Derivative"

**Deliverable:** Users can import from STAPLE and selected external catalogs, browse the public archive, and fork schemas.

### Phase 4: Polish + Organization

> **Goal:** Folders, tags, dashboard stats, FAIR metadata.

- [ ] Folder CRUD + UI sidebar on collection page (Naturally scopes to MARKER forms since queries filter by `app`)
- [ ] Form tagging UI (Domain/topic labels, not workflow labels)
- [ ] Endorsements UI on public schema detail pages (Like/Endorse button)
- [ ] Dashboard stats wired to real counts (published schemas, drafts, etc.)
- [ ] JSON-LD `@context` embedding on export
- [ ] Activity feed on dashboard (from real form events)

**Deliverable:** Feature-complete forms experience with organizational tools and FAIR compliance.

---

## 6. Open Design Questions

> These should be resolved before starting Phase 1 implementation.

### Q1: Auto-save vs. explicit save in FormStudio?

- **Auto-save** (debounced, e.g., 2s after last change) is smoother but could create many DB writes.
- **Explicit "Save" button** is simpler but risks data loss.
- **Recommendation:** Explicit save with a "dirty" indicator + unsaved changes warning on navigation.

### Q2: Denormalize Form metadata?

- Should `Form` have its own `name` and `description` columns, or do we always derive them from `FormVersion.name` / `FormVersion.schema.title`?
- **Recommendation:** Keep it denormalized on `Form` — the collection list needs fast access without parsing JSON.

### Q3: Version numbering strategy?

- Auto-increment integer (`FormVersion.version: 1, 2, 3...`) vs. semantic versioning strings (`"0.1.0"`, `"1.0.0"`)?
- The Prisma schema uses `Int` for `FormVersion.version` but `String` for `PublishedSchema.version`.
- **Recommendation:** Use `Int` auto-increment for draft versions (simple), semantic `String` for published schemas (explicit user control at publish time).

### Q4: Soft delete or hard delete?

- `Form.archived` exists. Do we use it (soft delete with "Archived" filter), or hard delete with a confirmation modal?
- **Recommendation:** Soft delete via `archived: true`. Show an "Archived" tab/filter on the collection page. Allow permanent deletion from the archive.

### Q5: PublishedSchema.uiSchema — persist or not?

- Without it, anyone viewing/forking loses the author's intended field layout and widget choices.
- **Recommendation:** Add `uiSchema Json?` to `PublishedSchema`. This requires a STAPLE-side migration since MARKER doesn't own the DB.

### Q6: Who owns DB migrations?

- Per `docs/deployment.md`, MARKER never runs migrations. Any schema changes (e.g., adding `uiSchema` to `PublishedSchema`, or `name`/`description` to `Form`) need to be coordinated with STAPLE.
- **Action:** List all needed schema changes and batch them into a single STAPLE migration PR.

---

## 7. Technical Notes

### Form Studio Package

The shared builder has been extracted to the GitHub-only
`@staple-verse/form-studio` package. MARKER owns routing, drafts, and persistence while the
package owns form-building state and UI. The package has no knowledge of Prisma, server
actions, or MARKER's App Router.

### Server Action Patterns

Follow the existing pattern in `features/auth/actions.ts`:

- Use `"use server"` directive
- Validate input with Zod
- Call Prisma via the shared `@/lib/db` client
- Return typed results (not raw Prisma objects)

### Migration Coordination

Any new columns or tables require changes in the STAPLE repository's Prisma schema and a migration there. MARKER's `schema.prisma` then mirrors those changes (without running migrations). Keep a running list of needed schema changes in this document.

#### Potential Schema Changes Needed

- [ ] Add `app String @default("staple")` to `Form` model (Product scoping: `"staple"` vs `"marker"`)
- [ ] Add `uiSchema Json?` to `PublishedSchema` model
- [ ] Add `releaseNotes String?` to `PublishedSchema` model
- [ ] Add `domain String?` to `PublishedSchema` model (Controlled vocabulary for research fields/subjects, e.g., "Neuroscience")
- [ ] Add `contributors Json?` to `PublishedSchema` model (Array of objects: name, ORCID, affiliation, email. Supports external authors).
- [ ] Add `relatedPublicationDoi String?` to `PublishedSchema` model
- [ ] Add `language String @default("en")` to `PublishedSchema` model
- [ ] Add `isSupersededBy String?` to `PublishedSchema` model (Stores the PID of a newer schema if this one is deprecated)
- [ ] Add `originalImportHash String?` to `Form` model (to track if a user modified an imported CEDAR/STAPLE schema)
- [ ] Add `viewCount Int @default(0)` and `usageCount Int @default(0)` to `PublishedSchema` model
- [ ] Add `endorsementCount Int @default(0)` to `PublishedSchema` model
- [ ] Add `SchemaEndorsement` model (join table for User ↔ PublishedSchema) to track likes
