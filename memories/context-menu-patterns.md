# Context menu patterns

- Designer context menus are registered centrally in `DefaultServiceBootstrap` and grouped with `ChildContextMenu` and `SeperatorContextMenu`.
- `ContextMenu` treats an item with title `-` as a divider.
- Paste-format reads the clipboard on demand through `copyPasteService.getPasteItems()` and uses the first parsed design item; this keeps the behavior independent of service-local clipboard state.
- Popover menus use explicit fixed `left`/`top` placement with viewport fallback. Global close listeners are registered after opening so mouse-down triggers do not immediately close the menu.
