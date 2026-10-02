# Copy preparation

- `ICopyPreparationService.prepareCopies(items, targetRoot)` is an optional application hook for preparing detached batches before insertion. The designer exposes it as `copyPreparationService`.
- `CopyPasteService.getPasteItems` and `CopyPasteAsJsonService.getPasteItems` apply preparation before returning items, including the JSON service's image branch. This uses `instanceServiceContainer.rootDesignItem`, so callers outside the canvas receive prepared items too. The canvas only inserts the returned items and must not prepare them again. Custom implementations and overrides that return their own items must honor the same contract.
- The pointer tool's command-key copy branch prepares its cloned batch before insertion because it does not use the paste service.
- There is no default implementation or default registration. A plain HTML designer preserves copied IDs, attributes, and references, even when IDs collide. Applications explicitly register their own implementation when needed.
- The hook can adjust any copied properties or attributes; it is not an ID-specific API. Prepare only the copies, before insertion, to avoid extra undo entries and changes to the original document.
- Pointer copies filter selected descendants when their ancestor is already selected, so nested items are copied once.
- The technology scheme editor registers `TsCopyPreparationService`. All ID collision handling and HTML/SVG/custom reference remapping live in that editor, rather than the designer library.
- Validation: designer and editor builds passed. Six linked editor browser tests passed, including direct paste-service calls, exactly one preparation call for canvas paste, unchanged default HTML copies, and scheme ID/reference remapping with undo/redo.
