# WI-CONSOLE-009 — SDD verification

- WI/ST/story: `WI-CONSOLE-009` / `ST-CONSOLE-011` / `HU04`.
- Owner: `spec/features/003-test-inventory`; applicable transversal specs: API client and testing.
- Contract: `INTEROP-2.6`, byte-for-byte mirror of Core's current working-tree file. Event `sourceRevision` `242ffbfa3eb0a6251aa42cc83bbbc06f0e5be279` remains the functional base; the user explicitly authorized mirroring its current `2026-09-27` cutoff date.
- Approved scope: update shared ProjectVersion/inventory response types and regression coverage; preserve the inventory as evidence-only and do not expose generation/execution readiness for PHP until Core `WI-CORE-013`.
- Decision gate: no `PENDING` decision has a `Blocks` scope reaching this type-sync/test-only cut. `DEC-INF-001` (remote Sandbox provisioning), `DEC-VAL-001` (enterprise-code ingestion/deployment), and `DEC-EXP-FK-001` (experiments with Functional Knowledge) do not block it.
- Scope exclusions: no UI redesign or new action, no new HU/epic, no Core/Sandbox edits, no OAuth/Action Required/branch-authorization changes.
- Decision: `G-PASSED`; implementation may proceed under the user's explicit authorization to complete `CS-CORE-20260927-001`.
