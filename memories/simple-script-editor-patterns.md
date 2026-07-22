# Simple Script editor patterns

- The command picker is a copy-only Wunderbaum drag source. The editor marks same-tree reorder drags with its custom data-transfer MIME type; foreign picker drops read the command type from `text/plain` and create a new command.
- Row drops are handled by Wunderbaum. Delegated native `dragover`/`drop` handlers on the stable list wrapper cover the empty area below rows, including an entirely empty list.
- `_draggedNode` supplies the node reference for same-tree moves, but the per-gesture MIME marker is the authoritative move-versus-copy signal. Document-level `dragend` cleanup prevents stale references.
- Code mode hides the property-grid pane and the split view's exposed splitter part so the Monaco view fills the available width.
- The picker and help use `VisualizationShell.openModal`; the picker closes through an `AbortController` passed as `abortSignal`.
