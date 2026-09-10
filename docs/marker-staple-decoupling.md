# MARKER ↔ STAPLE Relationship: Decoupling Decision & Target Data Model

> **Status:** Decided (product direction) — data model design ready for implementation planning
> **Last updated:** 2026-07-20
> **Supersedes:** The "Pending Decision" in [`forms-feature-plan.md`](./forms-feature-plan.md) §1 (import direction), and extends the `Form.app` scoping model described in [`architecture.md`](./architecture.md) §5
> **Origin:** Design discussion triggered by a disagreement over delete-behavior coupling between MARKER and STAPLE forms while implementing the `/collection` page (see [`refactor/collection-list-page.md`](./refactor/collection-list-page.md))

---

## 1. The question this doc resolves

While implementing `/collection`, a disagreement surfaced: **should a `formVersion`'s usage in a STAPLE task restrict what can be done to it in MARKER?** (e.g. if a user imports a MARKER draft into STAPLE and starts using it in a task, should that block other MARKER users from deleting/editing that draft?)

Chasing this question surfaced a bigger, unresolved one: **what *is* MARKER, structurally, relative to STAPLE?** Two candidate product visions emerged, and this doc records why one was chosen and what the resulting data model should look like.

---

## 2. Two candidate visions

### Vision 1 — "Thin wrapper"

MARKER has no data of its own. It reads STAPLE's `Form`/`FormVersion`/`Folder`/`tags` directly (all of which are already user-owned and project-independent in STAPLE — see §2.1) and adds only a Publish ceremony (`PublishedSchema` + FAIR metadata wizard) on top.

**Why it looked viable:** STAPLE's `Form` model already has almost the shape MARKER needs — `userId`-owned, optional `folderId`, `tags: Json?`, and creatable with zero `Task`/`Project` attachment. A "curated personal library independent of any project" is not unique to MARKER; STAPLE already supports it.

**Why it was rejected** (§3):
- It cannot support multi-user collaborative schema authorship without adding a wholly new sharing/ACL subsystem to STAPLE's live production schema — a system STAPLE's own product has no need for.
- STAPLE's edit-in-place logic (`updateForm`) has no concept of `VersionStatus`/`PublishedSchema`, so a "published" draft can silently diverge from what was actually published unless STAPLE is taught to respect that lock — a permanent cross-codebase coordination cost, not a one-time fix.
- It structurally re-couples MARKER and STAPLE (same rows, same table) — reintroducing the exact delete/usage coupling this whole discussion started from, just relocated rather than resolved.
- Pushed to its logical conclusion, it isn't "a simpler MARKER" — it's *no MARKER*, since a live-mirror-plus-publish-button doesn't need to be a separate application.

### Vision 2 — "Curated collaborative library" (Chosen)

MARKER owns its own tables, entirely separate from STAPLE's. Import is always **copy semantics**, never a live reference. This matches the existing "Zotero for schemas, Zenodo for publication" identity already stated in `architecture.md` §5, made structurally real rather than convention-enforced.

### 2.1 Deciding factor: the grant requirement

MARKER is funded by a grant that commits to building **community engagement around reusable metadata schemas** — multiple domain experts, not necessarily affiliated with the same STAPLE project (or with STAPLE at all), collaboratively developing and reviewing a schema. This is a non-negotiable deliverable, not a UX preference to be validated with users later.

STAPLE's only multi-user primitive is `ProjectMember` (project-scoped teams). Community-wide schema collaboration doesn't map onto that model — it needs a new sharing axis orthogonal to project membership. Building that inside STAPLE means:
- Retrofitting real per-form authorization onto STAPLE's forms module. (**Note:** while investigating this, we found STAPLE's `updateForm`/`updateFormMeta`/`deleteForm` mutations do not currently filter by `ctx.session.userId` at all — only `resolver.authorize()`, i.e. "is logged in." Single-owner enforcement today appears to be a UI convention, not a backend invariant. This is a pre-existing gap worth fixing in STAPLE **independently** of this decision — see §8.)
- Exposing sharing/invite UI to every STAPLE user, most of whom have no reason to use it.
- Solving a new "shared draft vs. task-deployed version" boundary problem inside STAPLE — which just reconstructs the MARKER/STAPLE separation *inside* STAPLE instead of removing it.

Building it in MARKER's own isolated tables avoids all of the above and keeps a still-evolving, grant-driven feature from destabilizing STAPLE's live production system.

---

## 3. Why Vision 1's specific failure modes matter (for the record)

| Concern | Detail |
|---|---|
| **Delete coupling** | The original disagreement. Under a shared table, STAPLE's `Task`/`Project` FK usage and MARKER's delete/edit actions operate on the same row — detachment is only a convention (`app !== "marker"` check), not a guarantee. |
| **Import direction ambiguity** | `forms-feature-plan.md`'s "Pending Decision" (Approach A: publish-only vs. Approach B: hard-copy drafts) doesn't matter as much once tables are separate — both approaches already specify copy semantics; the real fix is not sharing the table at all. |
| **External-source provenance (CEDAR/RedCap)** | Forcing an already-immutable, already-identified external schema through MARKER's own Publish Wizard would mint a redundant "canonical" identifier for something that already has one — a real FAIR violation risk, independent of Vision 1 vs. 2, but sharpened by this discussion (see §5). |
| **Version-copy scope on import** | Copy only the specific `FormVersion` selected, not the full history (matches `forkSchema`'s existing single-snapshot precedent) — avoids leaking STAPLE task-scoped editing noise into a curated library, and avoids ambiguity about which "current" version an import represents. |
| **STAPLE edit-in-place vs. publish lock** | STAPLE's `updateForm` only checks `Task`/`Project` usage before deciding to edit-in-place vs. version-bump; it has no concept of `FormVersion.status`. Under a shared table this can make a `PUBLISHED`-labeled draft silently diverge from what was actually published (the immutable `PublishedSchema.schemaJson` itself stays safe — only the mutable draft's label becomes misleading). |
| **DB-per-service vs. table-per-service** | A fully separate *database* was considered and rejected for now — it would sever the live `User` join (author names, ORCID, institution used directly in FAIR metadata) and reintroduce cross-service identity sync/cascade-delete problems that don't exist today. Table separation within the same Postgres instance gets the structural-detachment benefit without that cost. `User` remains the one deliberately shared table (a legitimate "shared kernel," unlike `Form`). |

---

## 4. Target data model

```
User (shared with STAPLE — the one deliberately shared table)
  │
  ├── MarkerForm                              (renamed from Form; MARKER-exclusive table)
  │     ├── ownerId → User
  │     ├── origin: NATIVE | IMPORTED_STAPLE | IMPORTED_EXTERNAL
  │     ├── externalSourceSystem?              ("cedar" | "redcap" | ...)
  │     ├── externalId? / externalSourceUrl?   (source system's own PID — distinct from relatedPublicationDoi)
  │     ├── importedFromStapleFormId?          (informational provenance only — never an FK)
  │     ├── importedFromStapleVersionNumber?
  │     ├── importedAt?
  │     ├── originalImportHash?                (fixity check vs. source content at import time)
  │     ├── tags Json?, archived
  │     │
  │     ├── MarkerFormVersion[]
  │     │     ├── status: DRAFT | PUBLISHED | ARCHIVED
  │     │     ├── schema / uiSchema
  │     │     ├── PublicationMetadata? (1:1)
  │     │     ├── PublishedSchema[]            (freeze target)
  │     │     └── NO tasks/projects relation — structurally cannot attach to a STAPLE task
  │     │
  │     ├── MarkerFormCollaborator[]           (NEW — see §7)
  │     │     ├── userId → User
  │     │     ├── role: OWNER | EDITOR | VIEWER
  │     │     └── invitedById, invitedAt, acceptedAt?
  │     │
  │     └── MarkerFormFolderPlacement[]        (NEW — MARKER-exclusive, not STAPLE's Folder; see §8)
  │           ├── userId → User                (whose personal filing this is)
  │           └── folderId → MarkerFolder
  │
  ├── MarkerFolder                              (NEW — MARKER-exclusive, parallel to STAPLE's own `Folder`)
  │     └── ownerId → User
  │
  └── PublishedSchema                          (unchanged shape, immutable snapshot + PID)
        ├── externalId? / externalSourceUrl?   (DataCite relatedIdentifier-style — see §5)
        └── SchemaEndorsement[]                (already planned — tier-1 community engagement)
```

**Key structural guarantee:** `MarkerFormVersion` has no relation to `Task`/`Project` at all. Detachment from STAPLE's usage semantics becomes something the schema enforces, not something application code has to remember to check.

---

## 5. Ingestion lanes ("original cataloging" vs. "copy cataloging")

Borrowed from library-science practice (original cataloging: you are the authority; copy cataloging: an authoritative record already exists elsewhere and you reuse it) and OAIS's separation of **fixity** (checksum), **provenance** (lineage), and **representation** (the content itself):

| Lane | `origin` | Behavior | FAIR gate |
|---|---|---|---|
| **Native** | `NATIVE` | Created from scratch in FormStudio | Full Publish Wizard required — MARKER is the authority; nothing else guarantees immutability/correctness. |
| **STAPLE import** | `IMPORTED_STAPLE` | Copy the **selected `FormVersion` only** (not full history) into MARKER — either a new `MarkerForm` v1 or an appended version on the parent MARKER form when updating. Record `importedFromStapleFormId`/`VersionNumber`/`importedAt` (informational, no FK) + `originalImportHash` (fixity). Round-trip: MARKER drafts may also be copied into STAPLE (create or update parent); that path is **not** publishing. See [`refactor/import.md`](./refactor/import.md). | Same as native — a STAPLE draft has no external immutability guarantee. Full Publish Wizard still required to mint a MARKER `PublishedSchema`. |
| **External import** | `IMPORTED_EXTERNAL` | CEDAR / RedCap / other external catalog APIs. Capture `externalId` / `externalSourceUrl` + fixity hash + license at ingestion time. | Lighter "cataloging" path. If the source already has a stable identifier + license, do **not** force a redundant re-publish — record the relationship (`IsIdenticalTo` / `IsDerivedFrom`, DataCite `relatedIdentifiers`/`relationType` vocabulary) instead of minting a competing canonical PID for content that already has one. |

`relatedPublicationDoi` on `PublishedSchema` stays scoped to "cite an associated paper" — it is **not** the right field for "this schema's own external identity," which is why `externalId`/`externalSourceUrl` are modeled separately.

---

## 6. Cross-system usage visibility (read-only, no coupling)

Detachment means MARKER's own delete/edit/publish authorization must never consult STAPLE's `Task`/`Project` usage (§4's structural guarantee). It does **not** mean MARKER should be blind to that usage for *display* purposes. A user who imported a draft from STAPLE benefits from seeing, on their own MARKER form, how the corresponding STAPLE-side content is currently being used — purely informational, never a gate. This is the "observability yes, coupling no" distinction raised earlier in the design discussion, and it costs nothing extra because of the table-vs-database decision in §3: since MARKER and STAPLE still share one Postgres instance (just not the `Form`/`FormVersion` tables), this is a same-database read query, not a cross-service API call.

**Design:**

- Applies only to `MarkerForm.origin === "IMPORTED_STAPLE"`, keyed off the provenance fields already defined in §4/§5: `importedFromStapleFormId` and `importedFromStapleVersionNumber`.
- Implemented as a dedicated **read-only query** (e.g. `getStapleUsageForImportedForm`) — never referenced from `getAuthorizedLatestVersion` or any write-path action, so it structurally cannot regress into the coupling this whole doc exists to remove.
- Looks up STAPLE's `Form`/`FormVersion` by the stored id/version **directly** (same DB, no FK — this is a soft lookup and must handle the row no longer existing, e.g. if it was hard-deleted on the STAPLE side per `deleteForm.ts`'s non-deployed branch). Missing source data renders as "no longer present in STAPLE," not an error.
- Scoped defensively to the querying user: only ever resolves STAPLE rows where `Form.userId` matches the current MARKER session's user, so this can never leak another user's STAPLE data even though it's a direct table read.
- Returns a small DTO — task/project counts at minimum, optionally project names with a deep link back into STAPLE — rendered as an informational panel on the MARKER form detail page (e.g. *"Imported from STAPLE Form #482 v3 — currently used in 2 tasks across 1 project"*).
- No STAPLE-side changes required — this is exactly the kind of feature the "table separation, not database separation" call in §3 was meant to keep cheap.
- Stretch goal, not required for v1: extend the same idea to `PublishedSchema.pid`, so a native/external-import schema that a STAPLE user separately references can surface similar usage information — same read-only principle, just keyed by PID instead of by import provenance.

---

## 7. Collaboration model — governance-based, not real-time

Modeled after how mature metadata standards bodies (DDI Alliance, HL7/FHIR, Dublin Core) actually run schema development: asynchronous review and consensus, not simultaneous multi-cursor editing (avoids CRDT/operational-transform engineering entirely).

| Tier | Mechanism | Status |
|---|---|---|
| **1 — Endorse / comment** | `SchemaEndorsement` | Already planned in `forms-feature-plan.md`. Consider extending to draft-stage feedback, not just published schemas, so community input can shape a schema before it freezes. |
| **2 — Shared edit rights** | `MarkerFormCollaborator` (`OWNER` / `EDITOR` / `VIEWER`) | New. Extends the existing write-side authorization pattern (`getAuthorizedLatestVersion`, `architecture.md` §8.10) to check collaborator role instead of strict `userId === ownerId`. |
| **3 — Propose / fork / review** | Fork a draft → edit the fork → submit as a proposal against the original → owner/maintainers accept or reject | Recommended over real-time co-editing. Gets genuine multi-stakeholder governance cheaply; matches real-world standards-body workflow. |

**Concurrency:** the optimistic-lock pattern already specified in `architecture.md` §8.11.5.1 (`expectedUpdatedAt` + `SELECT ... FOR UPDATE`) becomes load-bearing once real multi-editor use exists, not just a safeguard against a hypothetical race. Surface conflicts to the user ("someone else updated this") rather than silently overwriting.

---

## 8. Follow-up items outside this decision

- **STAPLE authorization gap (found during this analysis, not caused by it):** `src/forms/mutations/updateForm.ts`, `updateFormMeta.ts`, and `deleteForm.ts` do not filter by `ctx.session.userId` — only `resolver.authorize()` (authenticated, not owner-scoped). Any authenticated STAPLE user may currently be able to mutate any other user's form. Worth a dedicated fix in STAPLE, independent of the MARKER decoupling work.
- **Relationship vocabulary for forks/proposals:** if the Tier-3 proposal workflow ships, consider making `derivedFromPid`'s relationship explicit (`isNewVersionOf` / `isVariantFormOf` / `isDerivedFrom`, DataCite-style) rather than one implicit column, once forks-as-proposals become common enough to need disambiguation.

> **Resolved (no longer a follow-up):** Per-collaborator folder placement, and whether MARKER should have its own `Folder` table at all, were originally flagged here as deferred refinements. Both are now decided as part of the initial data model (§4, and `refactor/marker-data-model-decoupling-plan.md` §1.2): MARKER gets its own `MarkerFolder` — not a back-relation onto STAPLE's `Folder` — because the two organize by genuinely different taxonomies (project-workflow vs. domain/topic/publication status, `architecture.md` §5) and would otherwise collide in `Folder`'s `@@unique([name, userId])` namespace. Placement is modeled as a `MarkerFormFolderPlacement(userId, formId, folderId)` join table from day one, rather than a scalar `folderId` on `MarkerForm`, specifically so Collaboration Tier 2 doesn't require a follow-up migration to support per-collaborator filing.

---

## 9. Rollout sequencing

1. Design + create the new tables (`MarkerForm`, `MarkerFormVersion`, `MarkerFormCollaborator`, `MarkerFolder`, `MarkerFormFolderPlacement`, updated `PublishedSchema` fields) via STAPLE's migration pipeline (STAPLE owns all migrations per `deployment.md` — this is a purely additive, low-risk-to-review change).
2. Repoint `features/forms/actions`/`queries` at the new tables. **No data backfill:** only dummy/test data exists under `app: "marker"` today (no real MARKER users yet), so MARKER starts with these tables empty rather than migrating existing rows — see `refactor/marker-data-model-decoupling-plan.md` §0.
3. Remove the `app`-based tenancy check in `getAuthorizedLatestVersion` and the `app` filter in `getUserForms`.
4. Ship Tier 1 (draft-stage endorsement) and Tier 2 (`MarkerFormCollaborator` roles) before attempting Tier 3 (proposal workflow) — get the collaborator authorization model solid with a small set of roles before layering fork-based governance on top.
5. Add the cross-system usage visibility panel (§6) once `importedFromStapleFormId`/`importedFromStapleVersionNumber` are populated by the new import path — it's a pure read-side addition and can ship independently of the collaboration tiers.
6. Drop the now-dead `app` / `originalImportHash` columns from the old shared `Form` table in a follow-up cleanup migration once the new tables are confirmed working.

---

## 10. Relationship to existing docs

- ~~Resolves the "Pending Decision" in [`forms-feature-plan.md`](./forms-feature-plan.md) §1 as Approach A (PublishedSchema-only MARKER→STAPLE).~~ **Superseded 2026-07-28:** cross-app import is bidirectional and may copy **draft** versions as well as published tips; create-new vs update-parent outcomes. See [`refactor/import.md`](./refactor/import.md). `PublishedSchema` remains the public FAIR archive — draft export to STAPLE must not be presented as publishing. Table separation still holds: copies only, no live FKs, no task/project gates on MARKER auth.
- Extends `architecture.md` §5's "STAPLE vs. MARKER: Role Separation" table and "Import-as-Copy Semantics" section — the `app` field described there is superseded by fully separate tables (§4 of this doc).
- Should be cross-linked from `refactor/collection-list-page.md` once its delete-behavior section (§3.5) is revisited, since that page's queries/actions will move to the new tables per §9 above.
