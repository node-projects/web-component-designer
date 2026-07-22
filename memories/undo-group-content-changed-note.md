# Grouped undo content changes

- `UndoService.execute()` does not emit `instanceServiceContainer.onContentChanged` while a `ChangeGroup` is open.
- `ChangeGroup` accumulates content-change payloads from executed items and committed subgroups. The outermost commit emits them once, preventing document, tree, and property-grid observers from reacting to intermediate states.
