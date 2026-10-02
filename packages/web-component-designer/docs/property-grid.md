# Property grid

## Individual class bindings

The `class` / `className` row includes an expandable **Class bindings** section.
It lists bindings returned by the registered binding services, including bindings
created in source code. The ordinary class editor still edits the complete static
class string.

- **+**, or **Add class binding…** in the class row's menu, adds a conditional class.
- Selecting a binding name or double-clicking its summary edits the binding.
- The row's **⋯** menu offers editing, renaming the target class and removal.
- Names must be lowercase, without spaces or HTML attribute delimiters, because
  attribute-based binding syntax cannot preserve uppercase class names.
- Class-binding management requires a single selected element. Renaming and
  removal each form one undoable operation and leave the static class string alone.

Hosts that configure `serviceContainer.config.openBindingsEditor` receive a
boolean property adapter, the selected element, the existing binding (or
`undefined` for a new one), and `BindingTarget.class`. The host continues to save
bindings through its binding service, as for ordinary property bindings.

Without a host editor, the built-in expression dialog can create one-way
`class:is-active="[[isActive]]"` bindings through a registered
`BaseCustomWebcomponentBindingsService`. Existing bindings use their owning service
for saving, renaming and removal. Adding is disabled if neither a host editor nor
the built-in service is available.

The binding runtime still determines how target names are interpreted. The current
`base-custom-webcomponent` dependency converts `class:is-active` to the runtime
class `isActive`; use a token such as `active` if that runtime must toggle an exact
lowercase class. Visualization `bind-class:is-active` bindings preserve the
hyphenated token. The grid does not change either runtime's naming convention.

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
