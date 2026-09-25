import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { DesignItem } from './item/DesignItem.js';
import { IDesignItem } from './item/IDesignItem.js';
import { InstanceServiceContainer } from './services/InstanceServiceContainer.js';
import { ServiceContainer } from './services/ServiceContainer.js';
import { UndoService } from './services/undoService/UndoService.js';
import { SelectionService } from './services/selectionService/SelectionService.js';
import { DesignItemDocumentPositionService } from './services/designItemDocumentPositionService/DesignItemDocumentPositionService.js';
import { SetDesignItemsAction } from './services/undoService/transactionItems/SetDesignItemsAction.js';
import { StylesheetChangedAction } from './services/undoService/transactionItems/StylesheetChangedAction.js';
import { DomConverter } from './widgets/designerView/DomConverter.js';
import type { DesignerCanvas } from './widgets/designerView/designerCanvas.js';

/** Persistent browser editing state. A view is optional and never owns this document implicitly. */
export class EditingDocument {
  readonly instanceServiceContainer: InstanceServiceContainer;
  readonly rootDesignItem: IDesignItem;
  readonly onPendingChangesChanged = new TypedEvent<void>();
  readonly onCommitError = new TypedEvent<unknown>();
  private subscriptions: { dispose(): void }[] = [];
  private _pendingHtml: string | undefined;
  private pendingVersion = 0;
  private queue: Promise<void> = Promise.resolve();
  private initializedItems = new WeakSet<IDesignItem>();
  private disposed = false;
  private disposal: Promise<void>;
  private stylesheetWork: Promise<void> = Promise.resolve();
  private stylesheetTimer: ReturnType<typeof setTimeout>;

  constructor(readonly serviceContainer: ServiceContainer, root?: HTMLElement, canvas?: DesignerCanvas) {
    if (!canvas) {
      for (const name of ['undoService', 'selectionService', 'designItemDocumentPositionService', 'stylesheetService', 'collaborationService'] as const) {
        const factory = serviceContainer.getLastService(name);
        if (factory && !('createForDocument' in factory))
          throw new Error(`Detached documents require registerDocumentService('${name}', container => ...); the registered factory requires a canvas.`);
      }
    }
    const container = this.instanceServiceContainer = new InstanceServiceContainer(canvas);
    container.editingDocument = this;
    root ??= document.createElement('div');
    if (!(root instanceof HTMLIFrameElement) && !root.shadowRoot)
      root.attachShadow({ mode: 'open' });
    this.rootDesignItem = DesignItem.GetOrCreateDesignItem(root, root, serviceContainer, container);
    container.rootDesignItem = this.rootDesignItem;
    // Legacy factories require a real canvas. Never substitute a canvas-shaped document.
    for (const name of ['undoService', 'selectionService', 'designItemDocumentPositionService', 'stylesheetService', 'collaborationService'] as const) {
      const factory = serviceContainer.getLastService(name);
      let instance: any;
      if (factory) {
        const documentFactory = (factory as typeof factory & { createForDocument?: (container: InstanceServiceContainer) => any }).createForDocument;
        if (documentFactory)
          instance = documentFactory(container);
        else if (canvas) {
          canvas.instanceServiceContainer = container;
          canvas.rootDesignItem = this.rootDesignItem;
          instance = factory(canvas);
        } else
          throw new Error(`Detached documents require registerDocumentService('${name}', container => ...); the registered factory requires a canvas.`);
      } else if (name === 'undoService') instance = new UndoService(container);
      else if (name === 'selectionService') instance = new SelectionService(container, false);
      else if (name === 'designItemDocumentPositionService') instance = new DesignItemDocumentPositionService();
      if (instance) {
        container.register(name as any, instance);
        if (name === 'collaborationService') container.collaborationService = instance;
      }
    }
    const styles = container.stylesheetService;
    if (styles) {
      this.subscriptions.push(styles.stylesheetChanged.on(change => {
        if (change.changeSource !== 'undo' && !container.collaborationService?.isApplyingRemoteChanges)
          container.undoService.execute(new StylesheetChangedAction(styles, change.name, change.newStyle, change.oldStyle));
      }));
    }
    serviceContainer.instanceServiceContainerCreatedCallbacks.forEach(callback => callback(container));
  }

  /** Register resources created by document initialization callbacks. */
  addDisposable(resource: { dispose(): void }) {
    this.assertAlive();
    this.subscriptions.push(resource);
  }

  get pendingHtml() { return this._pendingHtml; }
  get hasPendingChanges() { return this._pendingHtml !== undefined; }
  get isDisposed() { return this.disposed; }

  assertAlive() {
    if (this.disposed) throw new Error('EditingDocument has been disposed.');
  }

  /** Called immediately by a code editor; text survives failed parses and view removal. */
  setPendingHtml(html: string) {
    this.assertAlive();
    this._pendingHtml = html;
    this.pendingVersion++;
    this.onPendingChangesChanged.emit();
  }

  /** Explicitly load/replace content. Initial loads may disable undo; code commits never do. */
  loadHtml(html: string, disableUndo = true): Promise<void> {
    this.assertAlive();
    return this.enqueue(async () => {
      try { await this.parseAndReplace(html, disableUndo); }
      catch (error) { this.onCommitError.emit(error); throw error; }
    });
  }

  private enqueue(operation: () => Promise<void>) {
    const result = this.queue.then(() => { this.assertAlive(); return operation(); });
    this.queue = result.catch(() => { });
    return result;
  }

  /** Await before using synchronous DesignItem APIs. Includes edits received during an async parse. */
  commitPendingChanges(): Promise<void> {
    this.assertAlive();
    return this.enqueue(async () => {
      while (this._pendingHtml !== undefined) {
        const html = this._pendingHtml;
        const version = this.pendingVersion;
        try {
          await this.parseAndReplace(html, false);
        } catch (error) {
          this.onCommitError.emit(error);
          throw error;
        }
        if (version === this.pendingVersion) {
          this._pendingHtml = undefined;
          this.onPendingChangesChanged.emit();
        }
      }
      await this.reparseDocumentStylesheets();
    });
  }

  private async parseAndReplace(html: string, disableUndo: boolean) {
    // Parse first: a rejected parser cannot remove the current items or clear their undo stack.
    const items = await this.serviceContainer.htmlParserService.parse(html, this.serviceContainer, this.instanceServiceContainer, false);
    this.assertAlive();
    if (disableUndo) {
      this.replaceItems(items);
      this.instanceServiceContainer.undoService.clear();
    } else {
      this.instanceServiceContainer.undoService.execute(new SetDesignItemsAction(items, [...this.rootDesignItem.children()], this.instanceServiceContainer));
    }
    await this.reparseDocumentStylesheets();
  }

  /** Internal mutation shared by load, canvas replacement and undo/redo. */
  replaceItems(items: IDesignItem[]) {
    this.assertAlive();
    const canvas = this.instanceServiceContainer.designerCanvas;
    canvas?.extensionManager?.removeAllExtensions();
    canvas?.overlayLayer?.removeAllOverlays();
    for (const item of [...this.rootDesignItem.children()]) this.rootDesignItem._removeChildInternal(item);
    for (const item of items) {
      this.rootDesignItem.document.adoptNode(item.node);
      this.rootDesignItem.window.customElements.upgrade(item.node);
    }
    this.rootDesignItem._insertChildsInternal(items);
    for (const item of items) {
      if (!this.initializedItems.has(item)) {
        this.serviceContainer.intializationService?.init(item);
        this.initializedItems.add(item);
      }
    }
    const selection = this.instanceServiceContainer.selectionService;
    if (selection instanceof SelectionService) selection._withoutUndoSetSelectedElements(null);
    else selection.clearSelectedElements();
    this.requestStylesheetReparse();
    this.instanceServiceContainer.onContentChanged.emit([{ changeType: 'parsed' }]);
  }

  requestStylesheetReparse() {
    if (this.disposed || !this.instanceServiceContainer.stylesheetService) return;
    clearTimeout(this.stylesheetTimer);
    this.stylesheetTimer = setTimeout(() => {
      void this.reparseDocumentStylesheets().catch(error => this.onCommitError.emit(error));
    }, 20);
  }

  reparseDocumentStylesheets(): Promise<void> {
    clearTimeout(this.stylesheetTimer);
    const update = this.stylesheetWork.then(async () => {
      if (this.disposed) return;
      const styles = this.instanceServiceContainer.stylesheetService;
      if (styles) {
        let index = 0;
        await styles.setDocumentStylesheets([...this.rootDesignItem.querySelectorAll('style')].map(element => {
          const item = DesignItem.GetDesignItem(element);
          return { name: '&lt;style&gt; #' + (element.id ? element.id + '(' + (++index) + ')' : ++index), content: item.content, designItem: item };
        }));
      }
    });
    this.stylesheetWork = update.catch(() => { });
    return update;
  }

  /** Synchronous writer for existing UI code. Programmatic consumers should await serialize(). */
  getHtml() {
    this.assertAlive();
    const items = [...this.rootDesignItem.children()];
    if (items.length) return DomConverter.ConvertToString(items, true, true);
    return this.serviceContainer.htmlWriterService.supportsRootItemWrite ? DomConverter.ConvertToString([this.rootDesignItem], true, true) : '';
  }

  async serialize(): Promise<string> {
    await this.commitPendingChanges();
    return this.getHtml();
  }

  /** Final release, unlike detaching a view. Rejects if pending text cannot be committed. */
  dispose(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    return this.disposal ??= this.disposeInternal().catch(error => {
      this.disposal = undefined;
      throw error;
    });
  }

  private async disposeInternal() {
    await this.commitPendingChanges();
    if (this.instanceServiceContainer.documentContainer)
      await this.instanceServiceContainer.documentContainer.detachDocument();
    else
      this.instanceServiceContainer.detachView?.();
    this.disposed = true;
    clearTimeout(this.stylesheetTimer);
    for (const subscription of this.subscriptions) subscription.dispose();
    this.subscriptions = [];
    const container = this.instanceServiceContainer;
    container.collaborationService?.disconnect();
    container.collaborationService?.detachTransport();
    container.undoService.clear();
    const services = new Set<any>();
    for (const name of ['undoService', 'selectionService', 'stylesheetService', 'designItemDocumentPositionService', 'collaborationService'])
      for (const service of container.getServices(name as any) ?? []) services.add(service);
    for (const service of services) service.dispose?.();
    for (const item of [...this.rootDesignItem.children()]) this.rootDesignItem._removeChildInternal(item);
    container.designItemDocumentPositionService?.clearSourceParts();
    if (container.selectionService instanceof SelectionService) container.selectionService._withoutUndoSetSelectedElements(null);
    (this.rootDesignItem.node as HTMLElement).remove();
    container.documentContainer = null;
    container.designer = null;
  }
}
