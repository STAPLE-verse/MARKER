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
