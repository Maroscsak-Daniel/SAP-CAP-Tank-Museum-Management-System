# SAP CAP / CDS gotchas

A running list of concrete CAP/CDS pitfalls encountered while building this project, with the fix that worked. All verified against `@sap/cds@9.7.1` in SAP Business Application Studio. Append to this file whenever something bites you and the fix isn't obvious from the error message.

## `@assert.unique` is entity-level, not field-level

Writing `name : String @assert.unique` on a single field looks like it should work but parses silently and creates no constraint. Correct form is on the entity:

```cds
@assert.unique: { name: [name] }
entity Tanks { ... }
```

## Enums don't validate at runtime by default

`type Foo : String enum { A; B }` is a documentation hint only — POSTing `"C"` is accepted. Add `@assert.range` to make it a real constraint:

```cds
@assert.range
type LocationKind : String enum { HALL; OUTDOOR; WORKSHOP; STORAGE; OFFSITE }
```

## Annotations on entities must precede the `entity` keyword

Placing `@(...)` *between* `: managed` and the opening brace is a parse error that cascades into a confusing "Duplicate definition" cascade for unrelated artifacts. Always:

```cds
@assert.unique: { name: [name] }
entity Tanks : managed { ... }
```

NOT `entity Tanks : managed @(assert.unique: ...) { ... }`.

## `cds watch` does not auto-deploy file-based SQLite in BAS when `cds-plugin-ui5` is mounted

After `rm db.sqlite`, the boot just opens an empty file and every query 500s with `no such table`. The fix is one explicit command:

```bash
cds deploy --to sqlite
```

Then `cds watch` is fine. The auto-deploy that works in vanilla CAP setups doesn't fire reliably with the UI5 plugin mounted.

## Bound-action annotations don't resolve via dotted paths

`annotate Service.Entity.actionName with @(...)` produces "Artifact not found". Use the `with actions { ... }` form instead:

```cds
annotate Service.Entity with actions {
  actionName @(...);
};
```

Note that `UI.ParameterDialog` and `UI.Parameters` are not standard OData vocabulary terms — they emit no Fiori effect even when correctly attached. For real parameter dialog customisation, use `@Common.Label` on each parameter.

## `.columns({ assoc: ['a','b'] })` is not valid CQN

That nested-object form gets serialized into a malformed SQL alias and 500s with SQLITE_ERROR. The mangled SQL looks like:

```
SELECT "$P".tank_ID as "ID,name,status_ID" FROM ...
```

Use flat path syntax (`'tank.name'`) or the documented expand form (`{ ref: ['tank'], expand: ['*'] }`) instead.

## `lastInsertRowid` is SQLite-only

`INSERT.into(X).entries(...)` returns it on SQLite but the field is `undefined` on HANA. For HANA-portable code, re-`SELECT.one` by the inserted row's known fields instead.

## `.http` files require `###` between every request

Without it, the next request's lines get appended to the previous request's JSON body, producing parse errors like "Unexpected non-whitespace character after JSON at position N".

## Fiori Elements V4 hides Create/Edit unless drafts are enabled

With `sap.fe.templates`, the List Report's Create button and the Object Page's Edit button simply don't render unless `@odata.draft.enabled` is on the entity. Older V2 templates allowed CRUD without drafts; V4 does not.

Add the annotation **inline on the projection in `srv/<service>.cds`**, not via a downstream `annotate` block in the app folder — empirically the latter is enough to turn Edit on but not enough to turn the list-level Create on:

```cds
service MuseumService {
  @odata.draft.enabled
  entity Tanks as projection on db.Tanks actions { ... };
}
```

Enabling drafts also requires a fresh `cds deploy --to sqlite` because CAP auto-generates `_drafts` companion tables.

## Action parameter value help is annotated separately from the entity field's value help

Annotating `Placements.location` with `@Common.ValueList` does NOT propagate to the auto-generated parameter dialog of a bound action that takes a `location_ID : Integer` parameter — the dialog is built from the action signature, which is unrelated to the entity. Use the `with actions { ... }` form to put value help on the parameter itself:

```cds
annotate MuseumService.Tanks with actions {
  moveTank (
    location_ID @(
      Common.Label: 'Location',
      Common.ValueList: {
        CollectionPath: 'Locations',
        Parameters: [
          { $Type: 'Common.ValueListParameterInOut',
            LocalDataProperty: location_ID,
            ValueListProperty: 'ID' },
          { $Type: 'Common.ValueListParameterDisplayOnly',
            ValueListProperty: 'name' }
        ]
      }
    ),
    fromDate @Common.Label: 'From Date',
    note     @Common.Label: 'Note'
  );
};
```
