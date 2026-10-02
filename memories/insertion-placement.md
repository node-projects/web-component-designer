# Insertion placement

- `IPlacementService.getInsertionIndex(container, item, index)` is an optional hook for container-specific DOM order.
- `DesignItem.insertChild` consults the hook before constructing an undo action. Sibling insertion delegates to this API. Undo actions accept the already resolved index and never consult placement services; internal parser/load operations do not invoke the hook.
- Drawing tools, paste, external drop, and rectangle-to-path conversion use the insertion API. Container entry already uses it. Consumers must use `insertChild` or `insertAdjacentElement` rather than creating insertion actions directly when placement policy should apply.
- Compute an index after excluding the inserted item from its existing container children, because internal insertion removes the item before inserting it.
- Consumers without the hook retain their requested insertion indices. The undo service contains no placement policy.
- `packages/web-component-designer/tests/InsertionPlacement.test.ts` covers API index resolution, redo determinism, sibling delegation, behavior without the hook, and both raw insertion actions ignoring placement services.
- Validated through npm links in the technology scheme editor's `core`, `tests`, and `app` packages. All packages share the linked base-component source at `D:/repos/github/nodeprojects/base-custom-webcomponent`; separate base installations cause incompatible private `TypedEvent` declarations.
- Designer and editor builds passed; the five insertion tests and four editor browser tests passed against the linked designer source.
