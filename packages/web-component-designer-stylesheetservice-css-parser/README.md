# web-component-designer-stylesheetservice-css-tools

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-stylesheetservice-css-parser

     npm i @node-projects/web-component-designer-stylesheetservice-css-parser

## Description

This is a Stylesheetparser using @node-projects/css-parser

## Usage

    import { CssParserStylesheetService } from '@node-projects/web-component-designer-stylesheetservice-css-parser';
    serviceContainer.registerDocumentService("stylesheetService", container => new CssParserStylesheetService(container));

## Conditional rule matching

`getAppliedRules(designItem)` evaluates `@media` using the element's own window,
`@supports` using that window's `CSS.supports()`, and `@container` using
`designItem.element.matchContainer(query).matches`. The complete container query,
including any container name, is passed to the browser. Nested conditions must all
match; nested selectors keep their parent selector context.

The container API is experimental. Chromium's prototype can be enabled with
`--enable-blink-features=ElementMatchContainer` (see the
[CSSWG discussion](https://github.com/w3c/csswg-drafts/issues/6205#issuecomment-6758924380)).
There is no addon flag: the service detects the method on the inspected element.
Without that API or a compatible polyfill, container rules are omitted from
applied rules. CSS can still render those rules even when the scripting API is
unavailable. `getRules(selector)` continues to include rules inside conditional
blocks regardless of their current match state, so lookup and editing work.

Results are evaluated when requested; this service does not subscribe to query
changes. After resizing a container, refresh the inspector (for example, reselect
the element).

Open [the HTML/CSS sample](examples/container-and-scope.html) in the designer:

- Select `#wide`: its matching container rule sets a green background.
- Select `#narrow`: its size query sets an orange background, and its style query
  sets purple text and a purple border in browsers supporting that query.
- Change either parent's width across 400px and reselect its card. The matching
  background rule switches. Above a 700px viewport, the wide card also matches
  the nested media/container rule setting bold text.

## Scope support

Scope rendering depends on the browser, but the addon's applied-rule inspection
has these limitations:

- `@scope` is parsed and preserved, but its rules are not traversed or reported.
  This also applies to inline `<style>@scope { ... }</style>`, where the style
  element's parent supplies the implicit scope root.
- `:scope` is passed to `Element.matches()`. That API uses the inspected element
  as its scope, which does not establish the scope root used by stylesheet rules.
  Consequently, stylesheet `:scope` matching is not correctly supported.
- Scope proximity is not included in declaration ordering.

The sample includes explicit scopes, scope limits, `:scope`, and an inline
implicit scope to demonstrate browser rendering separately from inspector support.
The old `<style scoped>` attribute is not an implementation of modern `@scope`;
use an inline `@scope` block instead.
