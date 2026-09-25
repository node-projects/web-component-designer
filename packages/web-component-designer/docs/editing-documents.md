# Application-owned editing documents

`EditingDocument` owns the root DesignItem, its DOM tree, instance services and undo history. It requires browser DOM APIs, but no DesignerView, connected element, layout or animation frame. It uses the configured parser, DesignItem services and HTML writer.

```ts
import {
  createDefaultServiceContainer, EditingDocument, DocumentContainer
} from '@node-projects/web-component-designer';

const services = createDefaultServiceContainer();
const document = new EditingDocument(services);
await document.loadHtml('<div id="pump" data-pressure="10"></div>');

// Use precisely the same APIs for open and closed pages.
await document.commitPendingChanges();
const pump = [...document.rootDesignItem.allMatching('#pump')][0];
const change = pump.openGroup('Synchronize pressure');
pump.setAttribute('data-pressure', '12');
change.commit();

const editor = new DocumentContainer(services, document);
host.append(editor);
await editor.whenReady();
// Code edits, designer edits and these programmatic edits share this document.
await document.commitPendingChanges();
pump.setAttribute('title', 'Supply pump');

await editor.detachDocument(); // Commits pending source; keeps items and undo.
editor.remove();
await editor.dispose();        // Cleans view resources, not the external document.
document.instanceServiceContainer.undoService.undo();
document.instanceServiceContainer.undoService.redo();

await editor2.attachDocument(document); // An existing DocumentContainer.
await editor2.detachDocument();

const html = await document.serialize();
// The application assigns html to its Page.html before saving/exporting/etc.
await document.dispose(); // Final release. Do not use its DesignItems afterward.
```

A plain DesignerView also supports `await view.attachDocument(document)` and `view.detachDocument()`. The latter is synchronous because a plain view has no code editor. An existing document can only have one attached editable view. Use a standard, non-iframe view for portable documents. The older iframe-backed standalone mode remains available; its readiness depends on the iframe loading in a connected view. Explicitly detaching a legacy iframe document moves its existing child nodes into a shadow host before the browsing context is destroyed. The root DesignItem and history survive; subsequent attachment uses a standard surface.

Constructing `new DocumentContainer(services, html)` or calling `view.initialize(services)` still creates an editor document. `container.whenReady()` awaits the initial load and any pending code changes, even when a standard container has not been connected. `container.dispose()` disposes its internally created document. Passing a document into the constructor, or using `attachDocument`, leaves ownership with the application. `detachDocument` transfers an internally created document to the caller as well. Always await container detachment/disposal; do not merely remove its element when closing a tab.

Attachment moves the existing DOM root, without writing/parsing HTML or recreating DesignItems or services. A detached custom element is upgraded using the document's custom-element registry; constructors can run without connection. Its normal connected/disconnected callbacks run when the view connects or disconnects. Register definitions before loading when property synchronization needs custom-element setters. Components that require layout or a connectedCallback to implement setters must support detached use themselves. The initialization service runs once per loaded top-level item, not on reattachment or undo.

## Readiness, code edits and errors

DesignItem APIs stay synchronous. Before programmatic querying, editing or undo/redo, await `document.commitPendingChanges()` (or `container.whenReady()`). Code widgets notify pending text through their existing `onTextChanged` event; custom integrations can call `document.setPendingHtml(text)`. Commits are serialized, include newer source received while an asynchronous parse is running, and require no frame delay. Direct DesignItem calls do not implicitly wait for code parsing.

`serialize()` commits pending code and then calls the existing writer. `getHtml()` and the existing `view.getDesignerHTML()` are synchronous snapshots of committed items; they do not commit pending source. No document serialization happens after each detached edit. The code panel still updates its displayed source during visible editing.

A parser rejection rejects the load/commit/serialize promise and emits `onCommitError` on the document (forwarded by DocumentContainer). The last successfully parsed items and their undo history remain intact, and `pendingHtml` retains the unsaved text. The application can show that error; the user can correct the source and retry. Container detach/dispose and document disposal also reject if pending source cannot be committed. They do not silently discard it. HTML validity is governed by the configured parser; tolerant HTML parsers can repair malformed markup rather than reject it.

`loadHtml(html, disableUndo = true)` is an explicit load. Its default clears history after a successful parse; pass `false` for an undoable replacement. Code commits always use undoable replacement. Loading new source creates new items; attaching a document does not. Commit existing pending source before explicitly loading other content.

## Custom services and migration

Existing `register('undoService', canvas => ...)` factories remain supported for standalone editor construction. For persistent documents, register factories that accept the actual InstanceServiceContainer:

```ts
services.registerDocumentService('undoService', container => new UndoService(container));
services.registerDocumentService('selectionService', container => new SelectionService(container, false));
services.registerDocumentService('stylesheetService', container => new MyStylesheetService(container));
```

The default bootstrap already uses document factories for undo, selection and source positions. The registration method also supports stylesheet and collaboration services. It preserves factory override order. Detached creation rejects an unmigrated canvas factory with an actionable error instead of supplying a fake canvas or silently replacing a custom implementation. Migrate custom services before detaching documents created by legacy editors, too.

Custom undo implementations retain `IUndoService` and its transaction semantics. They should keep the container rather than a canvas, emit transaction events and `container.onContentChanged` while detached, and call `container.refreshExtensions(items)` for optional visual refresh. Read `container.rootDesignItem` directly. `container.designerCanvas` is optional and changes on attachment. `UndoService`, `SelectionService` and `AbstractStylesheetService` accept either a container or the old canvas argument. Custom subclasses must widen their own constructors when registering document factories.

Document services that own resources should expose `dispose()`. Final document disposal invokes it once per instance, disconnects collaboration, clears undo/source positions and its stylesheet timer, and removes owned subscriptions. View detachment removes extension subscriptions, timers, observers and config-button subscriptions. A config-button provider can return elements with an optional `dispose()` hook for its own resources. Shared services in ServiceContainer remain owned by the application.


The in-repository CSS parser, collaboration, Mermaid and ZPL service factories use document services. The Node and Lit HTML parsers obtain their DOM from `container.rootDesignItem`. Register the CSS parser with `registerDocumentService('stylesheetService', container => new CssParserStylesheetService(container))`; its existing canvas constructor still works. Monaco retains source before its editor becomes visible and releases delayed initialization resources when disposed.

Services with view-specific hooks can subscribe to `container.onDesignerCanvasChanged`. Remove listeners from `oldCanvas` and install them on `newCanvas` only when present; use `isConnected` before measuring layout or refreshing overlays. Initialization callbacks can register their cleanup using `container.editingDocument.addDisposable({ dispose() { /* remove subscriptions */ } })`. Collaboration uses this lifecycle for pointer listeners; Mermaid uses it for its routing hook.


## Add-on view lifecycle

Ace, CodeMirror 5 and Monaco retain source passed to `update()` before their editor engines are ready. They notify code edits through `onTextChanged` immediately. `DocumentContainer` disposes its code view when closed; independently created code views must also be disposed by their owner. The CodeMirror 6 package currently contains only a commented-out implementation, so it has no runtime view to migrate.

Application-owned side panels can inspect a detached document through its `instanceServiceContainer`. Set `TreeViewExtended.instanceServiceContainer` or `EventAssignment.instanceServiceContainer` to `null` when unbinding a panel, and call `dispose()` when permanently closing it. The tree keeps its node references locally, cancels queued work on document switches, and runs canvas hover, layout-dependent drag/drop and designer menus only with a connected canvas. Mermaid's palette follows the attached document; loading another document while detached does not switch the palette.

The BaseCustomWebcomponent parser waits for stylesheet updates before resolving a load and rejects TypeScript syntax errors. Rejected code remains pending in the editing document for correction.
