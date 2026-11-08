# Source-part navigation

- Attribute source parts use `attribute:${name}` and `attribute:${name}/value`. `AbstractHtmlWriterService` generates them while writing with `updatePositions=true`.
- `DefaultHtmlParserService` cannot recover original DOMParser ranges, so a full parse rewrites the normalized design items with position updates. `NodeHtmlParserService` instead records element and attribute ranges directly during a full parse.
- When the target item may not already be primary, pass the source part to `selectionService.setSelectedElements(items, event, sourcePart)` in the same call. Splitting selection and part updates produces an intermediate element-range jump.
- `DocumentContainer` listens to both selection changes and selection refreshes so same-item part jumps update split/code view. It coalesces identical ranges before calling the code view.
- Monaco separately coalesces delayed native selections and clears a pending delayed selection when its model is updated.
- Before lazy Monaco creation, retain the latest requested selection and replay it once the editor and cursor listeners exist. Identical content updates retain that initial request; changed content and disposal invalidate it. DocumentContainer coalesces duplicate ranges, so an early request must not be silently dropped by the code view.
