# Tank Museum Management System

A SAP CAP backend for managing a tank museum's collection: physical assets, where they are, and where they've been. Built as a learning exercise in enterprise-style domain modelling on the SAP Cloud Application Programming Model.

Status: backend foundation is in place and validated end-to-end. Fiori UI exists as a scaffold; further work tracked separately.

## Domain model

Three core entities, deliberately separated so that asset identity, physical location, and movement history each live in their own table.

| Entity | Purpose |
|---|---|
| `Tanks` | Permanent assets. One row per physical vehicle. |
| `Locations` | Reusable physical places (halls, workshops, storage, outdoor, offsite). |
| `Placements` | History table — every `tank → location` interval with `fromDate` and optional `toDate`. A row with `toDate = null` represents the tank's *current* placement. |

```
Tanks 1───* Placements *───1 Locations
```

This shape avoids duplication, gives auditable movement history, and lets the *current* state be derived rather than stored redundantly.

Enums (runtime-enforced via `@assert.range`):
- `TankStatus`: `IN_STORAGE`, `ON_DISPLAY`, `UNDER_RESTORATION`
- `LocationKind`: `HALL`, `OUTDOOR`, `WORKSHOP`, `STORAGE`, `OFFSITE`

## Business rules

Implemented in `srv/museum-service.js`:

- **Placement integrity** on every CREATE/UPDATE/PATCH:
  - foreign keys must resolve (tank exists, location exists);
  - `fromDate` is mandatory, `toDate` (if set) cannot precede `fromDate`;
  - a tank cannot have two overlapping placements (half-open intervals `[from, to)`);
  - a tank cannot have more than one *current* (open-ended) placement.
- **Smart status sync** — when a tank's current placement changes, `Tanks.status` is updated to match the destination `LocationKind`:
  - `HALL` / `OUTDOOR` → `ON_DISPLAY`
  - `WORKSHOP` → `UNDER_RESTORATION`
  - `STORAGE` / `OFFSITE` → `IN_STORAGE`
  - applied on both write paths: direct `POST /Placements` and the `moveTank` action.
- **Delete protection** — Tanks and Locations referenced by any placement cannot be deleted.
- **`moveTank` action** — bound on `Tanks`, closes the current placement and opens a new one atomically. HANA-portable (does not rely on SQLite's `lastInsertRowid`).

Uniqueness:
- `Tanks.name` and `Locations.name` are unique (entity-level `@assert.unique`).

## Service surface

Two OData V4 services exposed by the CDS runtime:

| Path | Service | Purpose |
|---|---|---|
| `/odata/v4/museum` | `MuseumService` | Full CRUD on all three entities, plus the bound `moveTank` action and unbound `getCurrentPlacements` / `getLocationStats` actions. Carries all validation. |
| `/odata/v4/catalog` | `CatalogService` | Thin read-only projection, kept as a clean catalog surface for downstream read-only consumers. |

Metadata is at the service root (e.g. `/odata/v4/museum/$metadata`), not under any entity collection.

## Project layout

```
db/
  schema.cds              domain model
  data/                   seed CSVs (Tanks, Locations, Placements)
srv/
  museum-service.cds      MuseumService definition + bound/unbound actions
  museum-service.js       validation + action implementations
  museum-annotations.cds  UI annotations on MuseumService
  catalog-service.cds     read-only CatalogService projection
app/
  tank-ui/                Fiori Elements scaffold (work in progress)
test.http                 manual end-to-end test suite
```

## Local setup

Requires Node.js 18+, `@sap/cds-dk` installed globally (or use `npx cds`).

```bash
npm install
cds deploy --to sqlite       # creates db.sqlite and loads CSVs
cds watch                    # starts the server on :4004
```

The first time you `rm db.sqlite`, you'll need `cds deploy --to sqlite` again before `cds watch` — auto-deploy is not always triggered in environments with `cds-plugin-ui5` mounted.

## Testing

A manual `.http` suite at [`test.http`](test.http) walks through the full surface: schema constraints (uniqueness, enum validation), placement overlap rules, status sync via both write paths, `moveTank` semantics, and delete protection. Run it with the REST Client extension in VS Code or SAP Business Application Studio — send requests top-to-bottom; each `###` separator is one request.

## Tech stack

- [@sap/cds](https://cap.cloud.sap) 9.x — CAP runtime and CDS compiler
- [@cap-js/sqlite](https://www.npmjs.com/package/@cap-js/sqlite) — local dev database
- [@cap-js/hana](https://www.npmjs.com/package/@cap-js/hana) — production target (declared, not yet deployed)
- [UI5](https://ui5.sap.com) via [`cds-plugin-ui5`](https://www.npmjs.com/package/cds-plugin-ui5) — Fiori UI hosting

## Out of scope (for now)

- Authentication / authorisation beyond CAP's mocked auth.
- Cloud deployment (mta.yaml is scaffolded but unused).
- Multi-currency, internationalisation, accessibility.
- Polished Fiori UI — the scaffold is intentionally minimal.
