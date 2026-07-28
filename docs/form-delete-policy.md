# Form & Schema Delete Policy

> **Status:** Decided (product policy)  
> **Last updated:** 2026-07-20  
> **Related:** [`marker-staple-decoupling.md`](./marker-staple-decoupling.md) (structural detachment from STAPLE), [`forms-feature-plan.md`](./forms-feature-plan.md) §6 Q4 (soft delete vs. hard delete), [`architecture.md`](./architecture.md) §5 (MARKER as Zotero for schemas, Zenodo for publication)

---

## 1. What this doc resolves

MARKER manages two related but distinct things:

1. **Private workspace** — a user's `MarkerForm` and its `MarkerFormVersion` history (drafts, checkpoints, published-version snapshots in the owner's collection).
2. **Public archive record** — an immutable `PublishedSchema` with a persistent identifier (PID), minted at publish time.

Delete behavior must respect that split. A user should be able to discard private work freely, while anything that has entered the public archive must remain findable and citable in line with FAIR and repository norms.

This policy applies only to MARKER-owned data (`MarkerForm`, `MarkerFormVersion`, `PublishedSchema`). It does **not** govern STAPLE's own `Form`/`FormVersion` lifecycle, and MARKER delete authorization must never consult STAPLE task or project usage (see [`marker-staple-decoupling.md`](./marker-staple-decoupling.md) §4 and §6).

---

## 2. Guiding principle

| Lifecycle stage | Disposability | Rationale |
|---|---|---|
| **Draft** (never published) | Freely deletable, without a trace | No persistent identifier has been minted; nothing external can cite it. |
| **Published** (PID assigned) | Never deletable | The PID is a commitment to persistence. Removal, if ever allowed, would require a tombstone — not silent erasure. |

MARKER's publish step creates a **full snapshot** of schema content and FAIR metadata into `PublishedSchema`. After that, the public record is self-contained. The private workspace (`MarkerForm` / `MarkerFormVersion`) is analogous to a repository "deposit workspace"; `PublishedSchema` is the deposited, citable record.

---

## 3. How peer platforms handle this

We looked at common metadata and repository platforms to anchor the policy — not to copy any one system exactly, but to follow the same underlying invariant.

| Platform | Draft / unpublished | Published / identified |
|---|---|---|
| **CEDAR Metadata Center** | Draft artifacts can be deleted. | Published artifacts (`bibo:published`) are immutable; delete is not offered. Changes require creating a new draft version. |
| **DataCite** | Draft DOIs can be deleted. | Registered or Findable DOIs cannot be deleted. Retraction uses a tombstone page; the identifier and citation metadata persist. |
| **Zenodo** | Unpublished deposits can be removed. | Published records can be deleted by the owner under some conditions, but a **tombstone page** always remains at the same DOI so citations do not break. |

**Common thread:** draft work is disposable; anything that received a persistent identifier must leave a durable trace (full record or tombstone), never vanish without a redirect or explanation.

**MARKER's position:** Closer to CEDAR and DataCite for published content — `PublishedSchema` is never deletable. For the private workspace, closer to Zenodo — the owner may remove their collection entry even after publishing, because the public PID record already holds everything needed to resolve and cite the schema independently.

---

## 4. Policy by entity

### 4.1 `PublishedSchema` — never deletable

Once a schema is published and a PID is minted:

- The `PublishedSchema` row and its content **must not** be deleted, hard or soft.
- Public routes (e.g. `/schemas/[pid]`) must continue to resolve.
- If content must be withdrawn in the future, that is a separate **retraction / tombstone** feature (not in scope of this policy). It would mark the record as unavailable while preserving the PID and bibliographic metadata — consistent with DataCite tombstone practice.

### 4.2 `MarkerFormVersion` — depends on status

**Draft versions** (`status: DRAFT`, and not referenced by any `PublishedSchema`):

- May be **hard-deleted** with no trace.
- This is a **version-scoped** operation, distinct from deleting the whole form.
- Intended for pruning checkpoints, abandoned drafts, or mistaken saves in the version history — not for removing published work.

**Published versions** (`status: PUBLISHED`, or any version linked to a `PublishedSchema`):

- **Not deletable.** The version is part of the publication provenance chain; the immutable snapshot lives on `PublishedSchema`, but the version row documents *what* was published and *when*.

**Constraints on draft version delete:**

- A form must always retain at least one version. If the draft version is the **only** version on the form, the user should archive the **form** instead, not the version.
- Only the form owner (and eventually collaborators with delete rights — see [`marker-staple-decoupling.md`](./marker-staple-decoupling.md) §7) may delete versions.

### 4.3 `MarkerForm` — two-step delete (archive, then optional purge)

Form-level removal is always a **two-step** process. There is no single action that hard-deletes a form from the main collection.

#### Step 1 — Archive (always soft delete)

From `/collection` or `/collection/[id]`, the owner may **archive** any `MarkerForm` — draft-only or with published versions. This is unconditional:

- Sets `MarkerForm.archived = true` and cascades `archived: true` to all its `MarkerFormVersion` rows.
- Hides the form from the default collection list and blocks further edits/publish (archived forms are not mutable).
- Does **not** touch any `PublishedSchema`. Public PIDs keep resolving at `/schemas/[pid]`.

**When a form with published versions is archived:**

- All associated `PublishedSchema` records **remain** in the public archive with their PIDs unchanged.
- The `PublishedSchema` → `MarkerFormVersion` provenance link (`originFormVersionId`) **remains intact** because version rows still exist (soft-archived, not removed).
- Users who bookmarked `/collection/[id]` lose that private URL from active views; users who bookmarked `/schemas/[pid]` are unaffected.

**UX:** Step 1 should be labeled **"Archive"** (recoverable), not "Delete" — nothing is permanently removed at this stage.

#### Step 2 — Permanent delete (archive only, gated)

From a dedicated **Archived** view (see [`forms-feature-plan.md`](./forms-feature-plan.md) §6 Q4), the owner may **permanently delete** an archived form — but only if it has **never** produced a `PublishedSchema`:

| Archived form state | Permanent delete |
|---|---|
| All versions were draft-only (no `PublishedSchema` on any version) | **Allowed** — hard-delete `MarkerForm` and all its versions (cascades `PublicationMetadata`, collaborators, folder placements). No trace. |
| At least one version has a related `PublishedSchema` | **Not allowed** — archive is the terminal state for the private workspace. Provenance rows must stay so `originFormVersionId` continues to resolve. |

**Why the gate exists:** Hard-deleting a `MarkerFormVersion` that a `PublishedSchema` points at would sever the provenance link (`originFormVersionId` → `SetNull`). Soft archive preserves that link while still removing the form from the owner's active collection. Forms that were ever published therefore stop at archive; only never-published draft workspaces may be purged entirely.

**Safety properties:**

- Permanent delete requires the form to already be archived — it cannot be reached from the main collection list, so irreversibility is quarantined to a deliberate second surface.
- Once archived, the form cannot be published (authorization rejects archived forms), so publish history is frozen before the purge check runs.

---

## 5. Delete operations (conceptual)

MARKER exposes three distinct delete intents. They must not be conflated in UI copy or server behavior.

| Operation | Scope | Effect | When available |
|---|---|---|---|
| **Delete version** | Single `MarkerFormVersion` | Hard-delete one draft version; no trace | Draft versions only; not the sole remaining version; form must be active (not archived) |
| **Archive form** | Whole `MarkerForm` | Soft-archive form + all versions; hide from collection | Any form, including forms with published versions |
| **Permanently delete form** | Whole `MarkerForm` | Hard-delete form + all versions; no trace | Archived forms only; rejected if any version has a related `PublishedSchema` |

**Copy guidance:**

- **Archive form** — recoverable; stronger confirmation optional but not "cannot be undone."
- **Delete version** — irreversible; use explicit confirmation.
- **Permanently delete form** — irreversible; only in Archived view; explicit confirmation required.

---

## 6. What this policy explicitly does *not* do

- **Does not delete or hide `PublishedSchema`** — ever, under normal product operation.
- **Does not hard-delete a form with publish history** — even from the archive; archive is terminal for those workspaces.
- **Does not block form archive because STAPLE uses an imported copy** — MARKER and STAPLE are table-separated; STAPLE imports are hard copies, not live references ([`marker-staple-decoupling.md`](./marker-staple-decoupling.md)).
- **Does not retroactively remove PIDs, DOIs, or citations** — retraction/tombstone is a future, explicit feature if needed.
- **Does not allow deleting another user's published schemas** — ownership and collaborator rules apply separately.

---

## 7. Summary table

| Entity | Active (collection) | Archived | Has `PublishedSchema` |
|---|---|---|---|
| `MarkerFormVersion` (draft) | Hard-delete OK (if not sole version) | N/A (archived with parent form) | Never delete |
| `MarkerFormVersion` (published) | Never delete | Never delete | Never delete |
| `MarkerForm` | Archive only | Permanent delete OK **if** no published versions | Archive only (permanent delete blocked) |
| `PublishedSchema` | Never delete | Never delete | Never delete |

---

## 8. Relationship to other docs

- **`forms-feature-plan.md` §6 Q4** — recommends soft delete with an Archived tab and permanent delete from archive. This policy implements that model: Step 1 is always archive; Step 2 is permanent delete from the Archived view, gated on publish history.
- **`marker-staple-decoupling.md`** — the snapshot model and workspace/archive separation is what makes archive safe without touching public records; keeping published forms out of permanent delete preserves provenance links.
- **Collection list / detail / archive pages** — active collection surfaces expose Archive (Step 1) and version-level draft delete (§5); the Archived view exposes permanent delete (Step 2) only for eligible forms.
