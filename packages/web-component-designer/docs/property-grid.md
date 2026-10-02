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
