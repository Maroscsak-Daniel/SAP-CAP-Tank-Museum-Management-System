# BAS Fiori app URLs — preview vs real app

When running this project with `cds-plugin-ui5` in SAP Business Application Studio, the Fiori app is exposed at **two different URLs** with **different feature sets**. The distinction matters because Create / Edit / Save / Discard buttons silently disappear at one of them even when annotations are correct.

## The two URLs

### 1. Metadata preview — read-ish, hides Create/Save/Discard

URL pattern:

```
https://port4004-workspaces-ws-<id>.<region>.applicationstudio.cloud.sap/$fiori-preview/<ServiceName>/<EntityName>#preview-app&/?sap-iapp-state=...
```

This is BAS's built-in **Fiori Tools Preview** — a generic metadata-driven List Report that auto-renders any entity collection. Useful for quick "does my annotation render correctly" checks. **Deliberately hides Create / Edit / Save / Discard / inline-editing — even when `@odata.draft.enabled` is set on the entity.** Triggered by the "Preview Application" button in the BAS UI when right-clicking the manifest, or by `fiori-tools-preview` directly.

Use it for: inspecting LineItem, SelectionFields, HeaderInfo, value-help dialogs, action buttons that don't require draft state.

Do NOT use it for: testing Create, Edit, Save, Discard, or anything that depends on draft mode being live.

### 2. Real app — full Fiori Elements with all features

URL pattern:

```
https://port4004-workspaces-ws-<id>.<region>.applicationstudio.cloud.sap/<app-id>/index.html
```

Where `<app-id>` is the `sap.app.id` from the app's `manifest.json` (for this project: `tankui.tankui`). This is the real entry point served by `cds-plugin-ui5`. All features from the annotations apply: Create, Edit, Save, Discard, draft-mode editing, ValueLists, bound actions, custom dialogs, everything.

Use it for: actual end-to-end testing.

## Quickest way to open the real app

```bash
npm run watch-tank-ui
```

That script runs:

```
cds watch --open tankui.tankui/index.html?sap-ui-xx-viewCache=false --livereload false
```

It opens the real-app URL in the browser AND disables the UI5 view cache, so annotation changes are picked up immediately on hot reload.

## How to spot you're on the wrong URL

The browser tab title starts with **"Preview – "** (e.g. *"Preview – List of MuseumService.Tanks"*) when you're on the metadata preview. The real app's title comes from the i18n bundle (e.g. just the project name).

If a button you expect is missing, check the URL **first** before changing any annotation.
