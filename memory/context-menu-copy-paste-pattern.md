- Designer context menus are registered centrally in DefaultServiceBootstrap and grouped with ChildContextMenu plus SeperatorContextMenu.
- ContextMenu renders an item with title '-' as a divider, so submenu spacers should use that sentinel item.
- Clipboard-derived features can either write richer clipboard formats in copyItems or parse the current clipboard payload on demand; prefer the on-demand path when the behavior should work across browser instances without service-local state.
- For paste-format style transfer, prefer calling getPasteItems() and reading styles() from the first parsed design item instead of adding clipboard-specific methods to copy-paste services.

