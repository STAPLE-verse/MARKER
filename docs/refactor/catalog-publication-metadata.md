# Catalog & Publication Metadata Refactor

> **Status:** Design agreed — not yet implemented  
> **Last updated:** 2026-06-29  
> **Scope:** Persist publication wizard steps 1-2 during MARKER draft work, copy them across MARKER draft revisions, and freeze them into `PublishedSchema` at publish time.

---

## 1. Motivation

Today, MARKER collects FAIR catalog metadata only inside the publication wizard:

| Wizard step | Fields | Currently persisted? |
|-------------|--------|----------------------|
| Step 1 — FAIR Metadata | `domain`, `language`, `license`, `keywords` | No (React state only) |
| Step 2 — Contributors | `contributors[]` | No |
| Step 3 — Review & Freeze | `version`, `releaseNotes`, `relatedPublicationDoi` | Yes → `PublishedSchema` |

This creates avoidable friction:

1. Users cannot prepare or revise discovery/authorship metadata while a schema is still a draft.
2. New draft versions and clones copy schema JSON but lose publication metadata.
3. Multi-release workflows need revision-specific metadata before the final freeze.
4. Cataloging is part of MARKER's draft curation workflow, not only a last-minute publish step.

### What stays separate

- **Step 3 fields stay publish-only:** semantic version, release notes, related publication DOI.
- **FormStudio stays structural:** schema/uiSchema editing only.
- **`PublishedSchema` remains immutable:** public discovery, citation, JSON-LD, and content negotiation read frozen rows only.
- **STAPLE is not required to use this metadata:** STAPLE forms can continue to exist without publication metadata rows.

---

## 2. Data Model

Add one optional, MARKER-owned `publicationMetadata` row per `FormVersion`.

This metadata lives in a **separate table**, not on `FormVersion` itself. The table is linked to `FormVersion` with a one-to-one relation:

```text
FormVersion
  id
  publicationMetadata?  ───────►  PublicationMetadata
                                  formVersionId @unique

PublicationMetadata
  mutable while the MARKER version is DRAFT
  copied when MARKER creates a new draft version
  copied into PublishedSchema when published

PublishedSchema
  immutable public snapshot
```

### Librarian framing

| Layer | Role |
|-------|------|
| `PublicationMetadata` | Private draft catalog worksheet for one MARKER revision |
| `PublishedSchema` | Public, citable, immutable deposit record |

**Critical rule:** draft catalog metadata must never feed public Explore search, JSON-LD, or PID/content-negotiation responses. Only `PublishedSchema` is public.

---

## 3. Prisma Schema Changes

> **Migration owner:** STAPLE repository (`db/schema.prisma` + migration). MARKER mirrors the same shape in `prisma/schema.prisma` and runs `prisma generate` only. See `docs/deployment.md`.

### 3.1 New model

```prisma
model PublicationMetadata {
  id            Int         @id @default(autoincrement())
  formVersionId Int         @unique
  formVersion   FormVersion @relation(fields: [formVersionId], references: [id], onDelete: Cascade)

  domain        String?
  language      String?
  license       String?
  keywords      String[]    @default([])
  contributors  Json?       // Array<{ name, role, orcid? }>

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.2 Relation on `FormVersion`

```prisma
model FormVersion {
  // ... existing fields ...
  publicationMetadata PublicationMetadata?
}
```

### 3.3 STAPLE impact

- This is additive and optional.
- Existing STAPLE `FormVersion` rows do **not** need metadata rows.
- STAPLE can ignore the relation entirely.
- MARKER actions must only create/update metadata for `form.app === "marker"`.
- When a STAPLE form is imported into MARKER, the MARKER import creates its own draft copy and can create an empty/default metadata row at that point.

---

## 4. Field Ownership

| Field | Version metadata | PublishedSchema | Draft editable? | Publish wizard editable? |
|-------|:----------------:|:---------------:|:---------------:|:------------------------:|
| `domain` | yes | yes, frozen | latest MARKER draft only | yes |
| `language` | yes | yes, frozen | latest MARKER draft only | yes |
| `license` | yes | yes, frozen | latest MARKER draft only | yes |
| `keywords` | yes | yes, frozen | latest MARKER draft only | yes |
| `contributors` | yes | yes, frozen | latest MARKER draft only | yes |
| `version` (semver) | no | yes | no | step 3 only |
| `releaseNotes` | no | yes | no | step 3 only |
| `relatedPublicationDoi` | no | yes | no | step 3 only |

Structural fields (`FormVersion.name`, `schema.title`, `schema.description`, `schema`, `uiSchema`) are unchanged.

---

## 5. Creation & Copy Rules

Every MARKER code path that creates a `FormVersion` should also create or copy a `PublicationMetadata` row.

| Event | Metadata behavior |
|-------|-------------------|
| `createForm` | Create v1 metadata row with defaults: `language: "en"`, `license: "CC-BY 4.0"`, profile contributor if available, empty domain/keywords |
| `createFormVersionFromLatest` | Copy latest head metadata row |
| `cloneFormVersion` | Copy source version metadata row if present; otherwise create default row |
| `importFromStaple` (future) | Create MARKER draft copy with default/empty metadata row |
| `uploadJsonSchema` (future) | Create default/empty metadata row |
| `forkSchema` (future) | Copy from `PublishedSchema` snapshot |

If a MARKER draft somehow lacks a metadata row, the UI may treat it as empty/default metadata and create the row on save or publish.

Rules:

1. Latest MARKER draft metadata is mutable.
2. Historical draft metadata is read-only.
3. Published versions display `PublishedSchema`, not the draft metadata row.
4. New MARKER draft versions copy metadata from the previous head.
5. Public pages read only `PublishedSchema`.

---

## 6. Validation

Add one relaxed draft schema in `features/forms/schemas.ts`:

```ts
draftCatalogMetadataSchema
```

Used by `savePublicationMetadata`:

- Fields may be empty during drafting.
- Keywords are trimmed and deduped.
- Contributor objects are shape-validated when present.

Keep the existing strict `publishFormSchema` for publish:

- Requires domain, language, license, at least one keyword, at least one contributor, and valid semantic version.
- Step 3 fields keep current required/optional behavior.

---

## 7. Publish Semantics

At publish:

1. Publish wizard loads defaults from `version.publicationMetadata` if present.
2. User may edit steps 1-2 in the wizard.
3. Server validates the submitted payload with `publishFormSchema`.
4. Server normalizes the submitted step 1-2 values once.
5. In one transaction:
   - mark the `FormVersion` as `PUBLISHED`
   - write the normalized step 1-2 values back to `PublicationMetadata`
   - create the immutable `PublishedSchema`
6. If `PublishedSchema.create` fails, the metadata write-back must roll back too.

This keeps the draft worksheet matching the frozen public record for the published version.

---

## 8. UI / UX

### 8.1 Detail page catalog editor

Route: `/collection/[id]`

Add a “Catalog Metadata” section on the form detail page.

- Visible/editable only for the latest draft head.
- Reuse the Step 1 and Step 2 field components from the publish wizard.
- Save via `savePublicationMetadata`.
- Label clearly: “Draft catalog record — not public until published.”

Historical draft version:

- Show stored metadata read-only.

Published version:

- Show existing `PublicationMetadataCard` from `PublishedSchema`.
- Hide draft metadata editor.

### 8.2 Publish wizard

Steps 1-2 become review/confirm rather than first-time entry.

- `PublishSchemaClient` receives metadata defaults from the latest draft head.
- Steps remain editable as final attestation before freeze.
- Step 3 remains unchanged.

### 8.3 Component reuse

Extract shared field UI:

```text
features/forms/components/catalog/
  CatalogFairMetadataFields.tsx
  CatalogContributorsFields.tsx
  CatalogMetadataForm.tsx
```

Publish wizard steps and the detail-page editor both use these components.

---

## 9. DTO / Query Changes

Add DTOs:

```ts
export interface CatalogMetadataDTO {
  domain: string | null
  language: string | null
  license: string | null
  keywords: string[]
  contributors: ContributorDTO[]
}

export interface PublicationMetadataDTO extends CatalogMetadataDTO {
  updatedAt: string
}

export interface FormVersionDTO {
  // ... existing fields ...
  publicationMetadata: PublicationMetadataDTO | null
}
```

Update `getFormById`:

- Include `publicationMetadata` on each version.
- Map `contributors` JSON with a shared helper.
- Do not invent public metadata from drafts.

For the publish wizard, use `publicationMetadata` if present; otherwise use empty/default values.

---

## 10. Server Actions

### New action

| Action | Input | Behavior |
|--------|-------|----------|
| `savePublicationMetadata` | `{ formId, formVersionId, expectedMetadataUpdatedAt?, ...catalog fields }` | Authenticates ownership, verifies `app = "marker"`, verifies latest draft head, updates or creates metadata row. |

Use the existing parent `Form` row lock pattern for head-sensitive writes. If updating an existing row, use `expectedMetadataUpdatedAt` to reject stale writes.

### Modified actions

| Action | Change |
|--------|--------|
| `createForm` | Create v1 metadata row |
| `createFormVersionFromLatest` | Copy latest head metadata row |
| `cloneFormVersion` | Copy source metadata row or create defaults |
| `publishSchema` | Atomically write final step 1-2 values to metadata row and `PublishedSchema` |

---

## 11. Implementation Plan

### Phase 0 — Shared schema

1. Add `PublicationMetadata` model and optional `FormVersion.publicationMetadata` relation in STAPLE schema.
2. Create additive migration.
3. Sync MARKER `prisma/schema.prisma`.
4. Run `npx prisma generate` in MARKER.

No backfill is required. MARKER is dev and can reset its DB; STAPLE prod rows can simply have no metadata rows.

### Phase 1 — Data layer and publish prefill

1. Add DTOs and Zod schemas.
2. Add metadata helpers:
   - `mapContributors`
   - `normalizeKeywords`
   - `normalizeCatalogMetadata`
   - `copyMetadataFields`
3. Update create/version/clone actions to create or copy metadata rows.
4. Update `getFormById` to include metadata.
5. Update publish page to prefill steps 1-2 from draft metadata.
6. Update `publishSchema` to atomically write final step 1-2 values to metadata row and `PublishedSchema`.

Deliverable: metadata survives create, clone, version-bump, and publish prefill.

### Phase 2 — Detail page editor

1. Extract shared catalog field components.
2. Add `savePublicationMetadata` action and hook.
3. Add latest-draft catalog editor to `UserSchemaDetailsClient`.
4. Add read-only metadata display for historical drafts.
5. Keep published versions on `PublicationMetadataCard`.

Deliverable: users can edit steps 1-2 before opening the publish wizard.

### Phase 3 — Future ingestion paths

When implemented, wire metadata creation/copying into:

- `importFromStaple`
- `uploadJsonSchema`
- `forkSchema`

### Phase 4 — Docs

After code lands:

- Update `docs/architecture.md`.
- Update `docs/forms-feature-plan.md`.

---

## 12. Testing Checklist

Manual:

- [ ] Create MARKER draft → metadata row exists for v1.
- [ ] Publish wizard pre-fills from draft metadata.
- [ ] Edit catalog on detail page → persists after reload.
- [ ] `+ New version` → new row copies previous head metadata.
- [ ] Clone → new form v1 metadata matches source or uses defaults if source has none.
- [ ] Publish v1.0.0 → `PublishedSchema` has final submitted values.
- [ ] Failed publish after duplicate semver → no partial metadata write-back remains.
- [ ] New draft after publish → metadata copied and can diverge before v1.1.0.
- [ ] Historical draft → stored metadata is read-only.
- [ ] Published version → displays frozen `PublishedSchema`.
- [ ] Concurrent metadata edits → stale save returns `CONFLICT`.
- [ ] STAPLE form without metadata row remains unaffected.
- [ ] Imported STAPLE form into MARKER can add metadata during draft or publish.

Edge cases:

- [ ] Partial draft metadata allowed.
- [ ] Empty keywords allowed in draft but blocked at publish.
- [ ] Published head cannot save draft metadata.

---

## 13. Files to Modify or Create

### Schema

| Path | Action |
|------|--------|
| `STAPLE/db/schema.prisma` | Add model + relation |
| `STAPLE/db/migrations/<timestamp>_catalog_publication_metadata/migration.sql` | Additive migration |
| `prisma/schema.prisma` | Mirror STAPLE schema |

### Forms data layer

| Path | Action |
|------|--------|
| `features/forms/types.ts` | Add catalog DTOs |
| `features/forms/schemas.ts` | Add draft metadata schema/action input |
| `features/forms/utils/catalogMetadata.ts` | Create normalization/copy helpers |
| `features/forms/queries/getFormById.ts` | Include and map metadata |
| `features/forms/actions/createForm.ts` | Seed v1 metadata |
| `features/forms/actions/createFormVersionFromLatest.ts` | Copy metadata |
| `features/forms/actions/cloneFormVersion.ts` | Copy or seed metadata |
| `features/forms/actions/publishSchema.ts` | Atomic metadata write-back |
| `features/forms/actions/savePublicationMetadata.ts` | Create |
| `features/forms/actions/index.ts` | Export new action |
| `features/forms/hooks/useSavePublicationMetadata.ts` | Create |

### Components and routes

| Path | Action |
|------|--------|
| `features/forms/components/catalog/CatalogFairMetadataFields.tsx` | Create |
| `features/forms/components/catalog/CatalogContributorsFields.tsx` | Create |
| `features/forms/components/catalog/CatalogMetadataForm.tsx` | Create |
| `features/forms/components/DraftCatalogMetadataCard.tsx` | Create |
| `features/forms/components/DraftCatalogMetadataReadOnly.tsx` | Create |
| `app/(authenticated)/collection/[id]/UserSchemaDetailsClient.tsx` | Add editor/read-only display |
| `app/(authenticated)/collection/[id]/publish/page.tsx` | Pass metadata defaults |
| `app/(authenticated)/collection/[id]/publish/PublishSchemaClient.tsx` | Prefill defaults |
| `app/(authenticated)/collection/[id]/publish/components/Step1FairMetadata.tsx` | Reuse shared fields |
| `app/(authenticated)/collection/[id]/publish/components/Step2Contributors.tsx` | Reuse shared fields |

---

## 14. Summary

This refactor adds one optional, MARKER-owned `PublicationMetadata` table for publication wizard steps 1-2. MARKER drafts can edit and copy that metadata before publication. Publishing freezes the final submitted values into `PublishedSchema`. STAPLE production forms are not required to have metadata rows and can ignore the relation.
