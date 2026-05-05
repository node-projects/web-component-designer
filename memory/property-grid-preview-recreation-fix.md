# Property Grid Preview Element Recreation Fix

## Root Cause
`CssCurrentPropertiesService.getRefreshMode()` returns `RefreshMode.fullOnValueChange` (value 2).
When NumericStyleInput's preview sets `element.style.setProperty(...)`, the MutationObserver fires 
`PropertyGrid._mutationOccured()`, which calls `createElements()` for tabs with `fullOnValueChange`.
This DESTROYS and RECREATES all editors (including the active NumericStyleInput) mid-preview.

## Fix
- PropertyGrid keeps a single `MutationObserver` with `attributeOldValue: true`.
- `IPropertiesService` now has an optional `shouldRecreatePropertyListOnMutation(...)` hook.
- `AbstractPropertiesService` defaults to recreating only when an attribute is added or removed.
- `CssCurrentPropertiesService` and `CssCustomPropertiesService` override that hook to compare old/new inline style declaration names, so value-only style changes refresh editors but declaration add/remove still rebuilds.
- PropertyGrid also needs `designerCanvas.onContentChanged` and relevant `contentService.onContentChanged` subscriptions, because external property changes can arrive through undo/content notifications without a direct selected-element attribute mutation.

- `hasEditorInPreview()` and the schema-signature recreation path were removed.


## Key Enum Values (IPropertiesService.ts)
```
RefreshMode { none=0, full=1, fullOnValueChange=2, fullOnClassChange=3 }
```
- CssCurrentPropertiesService: fullOnValueChange (2) - the "styles" tab
- CssPropertiesService: none (0) - the "layout" tab
- AttributesPropertiesService: fullOnValueChange (2)
- NativeElementsPropertiesService: full (1)
