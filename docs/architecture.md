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

## 5. Schema Data Models & Versioning

STAPLE and MARKER handle forms differently based on their lifecycle stage.

- **STAPLE (The Workshop)**: Uses `Form` and `FormVersion` tables. These track the messy, private, iterative process of drafting forms for specific project tasks.
- **MARKER (The Marketplace)**: Uses a dedicated `PublishedSchema` table. This represents forms that are ready for community sharing or imported from external platforms like CEDAR.

### Versioning Strategy (The "Free DOI" approach)
Because DOIs are cost-prohibitive, MARKER guarantees traceability through **Immutability**.
- When a user publishes a form to MARKER, it is saved to the `PublishedSchema` table with a unique, persistent string identifier (PID, e.g., `ps_8f9a2b`) and a semantic version (e.g., `1.0.0`).
- **Immutable**: Once a `PublishedSchema` row is created, its JSON schema can never be edited.
- **Updates**: If an author updates a schema, a new row is created with the same `familyId` but a bumped version (`1.1.0`). Any researcher using `v1.0.0` is unaffected.

### Tracking Lineage (Forking)
Instead of a complex Git-like branching UI, lineage is tracked via a simple `derivedFromPid` column. If a user modifies a public schema and publishes it, the new schema simply records the PID of the original, ensuring proper academic credit.

## 6. Interoperability & FAIR Principles

To ensure forms can leave the STAPLE/MARKER ecosystem without losing their critical metadata, MARKER adheres strictly to FAIR Data Principles.

### Licensing (Reusability)
Every `PublishedSchema` must have an explicit license (defaulting to `CC-BY-4.0`) to ensure it is legally reusable by the scientific community.

### Content Negotiation (Accessibility)
The Persistent Identifier (PID) URL for a schema (e.g., `https://marker.stapleverse.org/schemas/ps_8f9a2b`) acts as a smart endpoint:
- **Browser (HTML)**: Returns the MARKER web interface for human readability.
- **API (JSON)**: If requested with `Accept: application/json`, it returns the raw JSON Schema file.

### Embedded JSON-LD (Interoperability)
STAPLE currently maps form data to standard `schema.org` vocabularies via JSON-LD. MARKER applies this same philosophy to the form schemas themselves. 
When exported, provenance metadata is embedded directly into the JSON using standard Semantic Web vocabularies (like Dublin Core and PROV-O), wrapped in a JSON-LD `@context`.

**Example Export:**
```json
{
  "@context": {
    "schema": "https://schema.org/",
    "prov": "http://www.w3.org/ns/prov#"
  },
  "$schema": "http://json-schema.org/draft-07/schema#",
  "@id": "https://marker.stapleverse.org/schemas/ps_8f9a2b",
  "title": "Cognitive Assessment",
  "schema:version": "1.0.0",
  "schema:creator": { "name": "Dr. Jane Doe" },
  "schema:license": "https://creativecommons.org/licenses/by/4.0/",
  "prov:wasDerivedFrom": "https://cedar.metadatacenter.org/templates/12345",
  "type": "object",
  "properties": { ... }
}
```
This ensures the schema remains fully valid for JSON Schema validators while simultaneously acting as a rich Linked Data node.
