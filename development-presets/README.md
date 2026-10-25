# Local experience presets

The development control panel writes one readable JSON file per experience here, for example
intro.json after saving the first intro preset. The agent can read these files directly; presets are
not hidden in a browser profile. Reloading the application keeps saved presets.

Select a preset to apply it, edit its values and save under the same name to update it. Saving with
a different name creates another snapshot. Saved names/IDs remain stable when updated. Reset
restores the experience defaults without deleting presets. Rename/delete and portable JSON
import/export are under Manage presets. Imports merge by ID or name and validate every value before
writing; incompatible versions/scopes/fields/ranges are rejected without changing existing files.

The format is {version: 1, scope, presets: [{id, name, settings}]}. Files contain numeric settings,
not renderer resources or generated grain data. Unsaved edits are marked Modified. Selecting a saved
preset is explicit; loading the app does not silently apply one.

The data-gui Vite plugin provides the file endpoint only during development. Builds and production
previews expose neither this endpoint nor these files. Browser tests use a separate temporary cache
directory and never write personal presets here. Preset files remain local authoring work until
explicitly included in a reviewed commit/publication.
