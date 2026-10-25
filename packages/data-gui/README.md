# data-gui

A numeric workbench with framework-independent settings/preset models and an isolated React view.
The package owns fields/defaults, reset/copy, preset validation, selection,
save/rename/delete/import/export, floating UI and cleanup. It imports no application, experience or
router code. The preset view uses Base UI Select, Collapsible, Input and Button; React/React DOM are
peers. The lower-level models, storage and floating DOM surface remain independent of React.

## Integration

Create a source with createSettingsControls({id, titleKey, defaults, fields, onChange}). Each field
specifies its numeric property, translation key, bounds and step. The callback receives a copied
settings snapshot; the source owns the mutable values and validates all programmatic imports before
applying them. No preset or DOM behavior belongs in the experience.

Create one createWorkbench({container, translate, storage, onError, displayFont?}), then call
setSource(source | null) as the active experience changes. Call refreshLabels on language changes;
position, minimized state, values and preset selection remain intact. Base UI owns popup placement,
focus, pointer/keyboard selection and typeahead; the package only composes/styles the components.
Dispose the workbench when its owner ends. Preset/default selection updates existing controls
without recreating scene/GPU resources. The source itself remains usable without the workbench.

Focused exports:

- create-settings-controls: typed numeric schema, source and immutable snapshots.
- create-workbench: complete floating workbench with preset UI and actions.
- create-data-gui: lower-level lil-gui adapter when only field controls are needed.
- create-floating-panel: independent DOM surface with movement/minimization and caller-owned slots.
- presets: createFilePresetStorage and portable PresetStorage/collection types.
- vite/preset-files: Node-only dataGuiPresetFiles({directory}) development plugin.

## Preset persistence

PresetStorage is injected: load(scope) returns a collection, save(collection) persists it. The file
adapter uses /__data-gui/presets/:scope. Configure the Vite plugin with an authoring directory; GET
reads it and PUT validates then atomically replaces a scope file. Writes are serialized. The plugin
is serve-only, rejects invalid scope paths and unrelated browser origins, and does not become a
production endpoint. Node imports stay outside browser exports. Node-facing internal imports use
explicit .ts extensions for Node 24 native stripping.

Collections use {version: 1, scope, presets: [{id, name, settings}]}. Names are unique ignoring
case; saving an existing name updates it in place. Imported collections merge by ID/name; validation
of all schemas/ranges precedes disk writes. A failed write leaves the manager's saved snapshot and
selection intact. Delete retains current values; selecting Defaults explicitly resets them. Portable
export produces a JSON download, while Copy copies only current settings.

Application code provides translation resources. UI keys are title/move/moveHint/collapse/expand/
footer/emptyTitle/empty/reset/copy/resetDone/copied/copyFailed and presets.* as illustrated by the
web development locale files. No i18n implementation is imposed on consumers.

Keep browser imports behind the host's development guard. A future production inspector would need
an appropriate storage adapter; the development filesystem endpoint is deliberately not deployed.

## Preset view

The native select is replaced by an authored popup using
[Base UI Select](https://base-ui.com/react/components/select). PresetForm is presentation-only;
createPresetControls bridges it to the existing imperative workbench through one owned React root.
Disposal unsubscribes synchronously, then unmounts that root in a microtask so a React host can
dispose the workbench during its own commit without nested-root unmount warnings. The popup is
portaled to the owning document and remains above the floating panel. Keyboard/pointer, Escape
cancellation, typeahead and small-viewport placement are browser-tested;
assistive-technology/device-matrix acceptance remains separate. Reduced motion disables the small
icon rotations. No custom combobox keyboard/focus implementation is maintained here.
