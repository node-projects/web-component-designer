# Property grid

## Addon extensions

The default grid has no class-binding controls. Addons can register providers in
`serviceContainer.propertyGridExtensions`. A provider's `createExtension(property)`
returns content for that property or `undefined`. The returned extension contains:

- `element`: content inserted below the property row.
- `refresh(items)`: updates for selection and value changes.
- Optional `getContextMenuItems(items)`: extra property-row actions.
- Optional `dispose()`: cleanup when the list rebuilds.

Extensions follow group visibility and receive the grid's `appearance` attribute.

## Visualization class bindings

Register `ClassBindingsPropertyGridExtensionProvider` from the visualization addon:

```ts
serviceContainer.propertyGridExtensions.push(new ClassBindingsPropertyGridExtensionProvider());
```

The addon places **Class bindings** below `class` / `className`. **+** asks only for
a lowercase class name, then calls the host's existing
`serviceContainer.config.openBindingsEditor` with a boolean property,
`BindingTarget.class`, the selection, and the existing binding (or `undefined`).
The demo connects this callback to the visualization addon's `BindingsEditor`.
There is no fallback expression editor; adding is disabled without a host editor.

Click a class name to edit it. The **⋯** menu offers edit, rename and removal.
Names must be lowercase without whitespace or HTML attribute delimiters.
Renaming and removal preserve binding options and are undoable. Management
requires one selected element. Source-created bindings appear automatically;
the ordinary class input continues to edit the static class string.

## Modern appearance

The existing components support an opt-in modern layout. Set the attribute before
or after connecting the grid, or use its `appearance` property:

```html
<node-projects-web-component-designer-property-grid-with-header
  appearance="modern">
</node-projects-web-component-designer-property-grid-with-header>
```

```ts
propertyGridWithHeader.appearance = 'modern';
// Also supported on the plain PropertyGrid:
propertyGrid.appearance = 'modern';
```

The modern layout uses aligned rows with subtle dividers, inline editors, action
buttons on the right, and a clearer inspector header. Conditional classes remain
nested below the class row. Existing editors, drag/drop, menus, tabs, and binding
services are shared with the classic layout. Switching appearance does not rebuild
the editors or discard their values. `classic` remains the default.

The modern appearance follows the system light/dark preference when no theme is
supplied. Existing `--wcd-color-*`, editor styling and tab tokens take precedence.
Additional sizing tokens are `--wcd-property-grid-row-height` (default `40px`) and
`--wcd-property-grid-font-family` (default `system-ui, sans-serif`).
