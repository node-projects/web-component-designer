# Insertion placement

- `IPlacementService.getInsertionIndex(container, item, index)` is an optional hook for container-specific DOM order.
- `InsertAction` and `InsertChildAction` consult it when created and record the resolved index. Undo and redo do not resolve it again, and internal parser/load operations do not invoke it.
- Compute an index after excluding the inserted item from its existing container children, because internal insertion removes the item before inserting it.
- Consumers without the hook retain their requested insertion indices. The undo service contains no placement policy.
- `packages/web-component-designer/tests/InsertionPlacement.test.ts` covers the two insertion actions, redo determinism, and behavior without the hook.
- Validated through npm links in the technology scheme editor's `core`, `tests`, and `app` packages. All packages share the linked base-component source at `D:/repos/github/nodeprojects/base-custom-webcomponent`; separate base installations cause incompatible private `TypedEvent` declarations.
- Designer and editor builds passed; the four hook tests and four editor browser tests passed against the linked designer source.
