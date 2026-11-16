# Context menu patterns

- Shared localization belongs to the basic designer's `ITranslationService`, registered as `translationService` on each `ServiceContainer`. The default service keeps English text and replaces named parameters once. Resolve the service when displaying UI so host language changes and replacement translators take effect; never translate user-written parameter values.
- Built-in menus/prompts call the service directly. Persistent UI and tooltips use explicit `data-wcd-i18n-*` markers with `bindDesignerUiTranslation`; dispose bindings with their views/popups. `languageChanged.on` is optional for host translators. Never mark input values, CSS command values, reactive document values or authored canvas/preview content. Keep option values explicit when translating option labels. `DesignerUiTranslation` avoids document and third-party code-editor subtrees.

- Designer context menus are registered centrally in `DefaultServiceBootstrap` and grouped with `ChildContextMenu` and `SeperatorContextMenu`.
- `ContextMenu` treats an item with title `-` as a divider.
- Paste-format reads the clipboard on demand through `copyPasteService.getPasteItems()` and uses the first parsed design item; this keeps the behavior independent of service-local clipboard state.
- Popover menus use explicit fixed `left`/`top` placement with viewport fallback. Global close listeners are registered after opening so mouse-down triggers do not immediately close the menu.
- Context menus use the initiating event's document unless an explicit root is supplied. Create nodes and stylesheet copies in that document, use its viewport for root/submenu positioning, and attach dismissal listeners to its window. Remove listeners and pending registration timers on close or page hide. Inside-click checks use the composed path across shadow roots and window realms. Coverage is in `ContextMenu.test.ts` and the editor's detached Solution Explorer browser regression.
