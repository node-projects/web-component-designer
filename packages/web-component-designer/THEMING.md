# Theming

The designer chrome is styled through CSS custom properties. Set them anywhere above
the designer in the DOM — custom properties inherit through shadow boundaries, so a
declaration on `:root` reaches every widget.

```css
:root {
  --wcd-color-surface: #1b1b1f;
  --wcd-color-surface-raised: #26262c;
  --wcd-color-surface-hover: #32323a;
  --wcd-color-text: #e6e6e6;
  --wcd-color-accent: #4f9cf9;
}
```

These style the **designer's own UI**. To style the document being edited, use
`documentContainer.additionalStyles` / `additionalStylesheets` instead — that is a
separate mechanism that injects stylesheets into the design surface.

## How a value resolves

Every themable declaration reads through a fallback chain:

```css
background: var(--wcd-tab-header-background,          /* 1. component token   */
             var(--dark-grey,                          /* 2. legacy alias      */
              var(--wcd-color-surface, #232733)));     /* 3. global role, 4. built-in default */
```

1. **Component token** — the most specific knob, for one part of one widget.
2. **Legacy alias** — the pre-`--wcd-` variable name, still honoured (see below).
3. **Global role** — the broad knob; set these to reskin the whole designer.
4. **Built-in default** — the value that shipped before theming existed.

Set nothing and you get exactly the previous appearance. The defaults live only in
`var()` fallbacks — the designer never *declares* a public token internally, so a value
you set on an ancestor is never overridden from inside a shadow root.

## Global roles

The complete set. Everything else is a component token.

| Token | Role |
| --- | --- |
| `--wcd-color-surface` | Panel / window background |
| `--wcd-color-surface-raised` | Controls, inputs and rows sitting on a surface |
| `--wcd-color-surface-hover` | Hover and selected-row background |
| `--wcd-color-text` | Primary text |
| `--wcd-color-text-muted` | Secondary, disabled and unset-value text |
| `--wcd-color-border` | Default border |
| `--wcd-color-border-strong` | High-contrast border |
| `--wcd-color-accent` | Active indicators, selected tab marker |
| `--wcd-color-accent-text` | Text rendered in the accent colour |
| `--wcd-color-accent-border` | Border rendered in the accent colour |
| `--wcd-color-focus` | Focus ring |
| `--wcd-color-error` | Invalid-input border |
| `--wcd-color-error-glow` | Invalid-input glow |
| `--wcd-color-selection` | Selection outline on the canvas |
| `--wcd-color-selection-fill` | Selection rectangle fill |
| `--wcd-color-snapline` | Snapline stroke |
| `--wcd-color-handle` | Geometry handle fill |
| `--wcd-color-handle-stroke` | Geometry handle stroke |
| `--wcd-color-handle-active` | Active geometry handle fill |

> `--wcd-color-editor-background` is **not** a global role — it is the ColorEditor
> widget's background. The table above is exhaustive.

### Two default palettes

The classic chrome (tab control, tree view, palette, property grid) and the tool
windows (border-radius, box-shadow, gradient, text-shadow editors) ship with different
dark palettes. Both read the same global roles but keep their own literal defaults, so
setting `--wcd-color-surface` unifies them while changing nothing by default.

### Light-by-default components

`ContextMenu` and `PlainScrollbar` default to a light palette and are deliberately
**not** wired to the global roles — chaining them to the dark chrome roles would invert
them. Theme them through their own tokens (`--wcd-context-menu-*`,
`--wcd-plain-scrollbar-*`).

## Component tokens

Named `--wcd-<component>-<part>-<property>`.

**Tab control** — `tab-header-background`, `tab-header-hover-background`,
`tab-selected-background`, `tab-selected-indicator-color`, `tab-panel-background`

**Tree view** — `tree-view-background`, `tree-view-item-hover-background`,
`tree-view-item-selected-background`, `tree-view-id-color`, `tree-view-connector-color`

**Property grid** — `property-grid-background`, `property-grid-text-color`,
`property-grid-unset-value-color`, `property-grid-group-header-hover-color`,
`property-grid-drop-target-color`, `property-grid-select-option-color`,
`property-grid-header-highlight-color`, `property-grid-tab-indicator-color`,
`property-grid-tab-indicator-inactive-color`

**Palette** — `palette-item-hover-background`

**Designer view** — `designer-view-toolbar-background`, `designer-view-statusbar-background`,
`designer-view-tool-selected-background`, `designer-view-tool-hover-background`,
`designer-view-corner-background`

**Canvas** — `canvas-background`, `screenshot-background`, `canvas-search-background`,
`canvas-search-container-background`, `canvas-search-border-color`,
`canvas-search-button-hover-background`, `canvas-drag-file-outline-color`,
`canvas-loading-background`, `grid-stroke-color`, `grid-fill-color`

**Overlay layer** — `overlay-toolbar-background`, `overlay-toolbar-button-border-color`,
`overlay-toolbar-button-hover-background`

**Tool windows / popups** — `tool-popup-background`, `tool-popup-title-background`,
`tool-popup-border-color`, `tool-window-shadow-color`, `tool-window-close-hover-background`,
`toolbar-button-selected-background`, `transform-tool-divider-color`,
`border-radius-editor-preview-background`, `box-shadow-editor-preview-background`,
`box-shadow-editor-preview-box-background`, `gradient-editor-stop-border-color`,
`gradient-editor-stop-selected-border-color`, `gradient-editor-stop-selected-glow-color`

**Inputs and editors** — `input-background-color`, `input-border-color`,
`color-editor-background`, `numeric-style-input-select-option-color`,
`thickness-editor-background`, `thickness-editor-border-color`,
`metrics-editor-margin-background`, `metrics-editor-border-background`,
`metrics-editor-padding-background`, `metrics-editor-content-background`,
`metrics-editor-label-background`, `image-button-list-selector-property-color`,
`image-button-list-selector-value-color`, `image-button-list-selector-value-set-color`,
`image-button-list-selector-button-background`,
`image-button-list-selector-button-border-color`

**Other views** — `layer-depth-view-background`, `layer-depth-view-text-color`,
`layer-depth-view-muted-color`, `layer-depth-view-card-background`,
`layer-depth-view-card-border-color`, `miniature-view-border-color`,
`demo-view-background`, `demo-view-toolbar-background`, `demo-view-toolbar-border-color`,
`debug-view-cell-border-color`, `debug-view-header-background`,
`debug-view-row-hover-background`, `debug-view-link-color`

**Context menu** — `context-menu-background`, `context-menu-color`,
`context-menu-hover-background`, `context-menu-marked-background`,
`context-menu-disabled-color`, `context-menu-divider-color`, `context-menu-border`,
`context-menu-border-radius`, `context-menu-shadow`, `context-menu-padding`,
`context-menu-item-padding-y`, `context-menu-icon-size`, `context-menu-icon-column-width`,
`context-menu-font-family`, `context-menu-font-size`, `context-menu-font-weight`

**Scrollbar** — `plain-scrollbar-thumb-background-color`,
`plain-scrollbar-thumb-background-color-hover`, `plain-scrollbar-thumb-background-color-active`,
`plain-scrollbar-thumb-border-color`, `plain-scrollbar-thumb-border-width`,
`plain-scrollbar-thumb-border-radius`, `plain-scrollbar-track-background-color`,
`plain-scrollbar-track-border-color`, `plain-scrollbar-button-color`,
`plain-scrollbar-button-color-hover`, `plain-scrollbar-button-color-active`,
`plain-scrollbar-button-size`

## Legacy variable names

The variables that were themable before this scheme existed still work and take
precedence over the global roles, so existing setups are unaffected. Prefer the
`--wcd-` names in new code.

| Legacy | Replacement |
| --- | --- |
| `--dark-grey` | `--wcd-color-surface` |
| `--medium-grey` | `--wcd-color-surface-raised` |
| `--light-grey` | `--wcd-color-surface-hover` |
| `--highlight-pink` | `--wcd-color-accent` |
| `--input-border-color` | `--wcd-input-border-color` |
| `--input-background-color` | `--wcd-input-background-color` |
| `--property-grid-text-color` | `--wcd-property-grid-text-color` |
| `--color-editor-background` | `--wcd-color-editor-background` |
| `--numeric-style-input-select-option-color` | `--wcd-numeric-style-input-select-option-color` |
| `--svg-grid-stroke-color` | `--wcd-grid-stroke-color` |
| `--svg-grid-fill-color` | `--wcd-grid-fill-color` |
| `--node-projects-web-component-designer-background` | `--wcd-canvas-background` |
| `--node-projects-web-component-designer-screenshot-background` | `--wcd-screenshot-background` |
| `--context-menu-*` | `--wcd-context-menu-*` |
| `--plain-scrollbar-*` | `--wcd-plain-scrollbar-*` |

`--wcd-grid-stroke-color`, `--wcd-grid-fill-color` and
`--wcd-property-grid-tab-indicator-inactive-color` have **no built-in default**, matching
the previous behaviour: leave them unset and the declaration stays invalid, so nothing is
painted.

## Not themable

The colour picker's handle rings, focus glows and alpha checkerboards are left as
literals on purpose — they have to stay legible against whatever colour is being
edited, so a theme must not be able to wash them out.
