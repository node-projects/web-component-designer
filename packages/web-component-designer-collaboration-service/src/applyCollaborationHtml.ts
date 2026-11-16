import { EditingDocument, IContentChanged, IDesignItem, NodeType, TextContentChangeAction } from '@node-projects/web-component-designer';
import { mergeCollaborationHtml } from './mergeCollaborationHtml.js';

/** Apply shared HTML without replacing unchanged items, active selections or an in-progress drag. */
export async function applyCollaborationHtml(document: EditingDocument, html: string, attributesChanged?: (item: IDesignItem) => void): Promise<void> {
  const container = document.instanceServiceContainer;
  let before = document.getHtml();
  let items = await document.serviceContainer.htmlParserService.parse(html, document.serviceContainer, container, false);
  // Parsing may yield while the local user continues typing or dragging.
  while (before !== document.getHtml()) {
    const current = document.getHtml();
    html = mergeCollaborationHtml(before, current, html);
    before = current;
    items = await document.serviceContainer.htmlParserService.parse(html, document.serviceContainer, container, false);
  }
  const ids = new Map<string, IDesignItem>();
  const duplicates = new Set<string>();
  for (const item of document.rootDesignItem.children(true)) {
    if (item.nodeType !== NodeType.Element || !item.id) continue;
    if (ids.has(item.id)) duplicates.add(item.id);
    else ids.set(item.id, item);
  }
  const used = new Set<IDesignItem>();
  const changes: IContentChanged[] = [];
  const compatible = (a: IDesignItem, b: IDesignItem) => a && a.nodeType === b.nodeType && a.name === b.name;
  const sync = (target: IDesignItem, source: IDesignItem) => {
    used.add(target);
    if (target.nodeType === NodeType.TextNode || target.nodeType === NodeType.Comment) {
      if (target.content !== source.content) changes.push(...(new TextContentChangeAction(target, source.content, target.content).do() ?? []));
      return;
    }
    let changed = false;
    const oldAttributes = new Map(target.attributes());
    const newAttributes = new Map(source.attributes());
    for (const name of oldAttributes.keys()) if (!newAttributes.has(name)) {
      target._withoutUndoRemoveAttribute(name); changed = true;
      changes.push({ changeType: 'changed', designItems: [target], type: 'attribute', name });
    }
    for (const [name, value] of newAttributes) if (target.getAttribute(name) !== value) {
      target._withoutUndoSetAttribute(name, value); changed = true;
      changes.push({ changeType: 'changed', designItems: [target], type: 'attribute', name });
    }
    if (changed) attributesChanged?.(target);
    const newStyles = new Map(source.styles());
    for (const [name] of [...target.styles()]) if (!newStyles.has(name)) {
      target._withoutUndoRemoveStyle(name);
      changes.push({ changeType: 'changed', designItems: [target], type: 'css', name });
    }
    for (const [name, value] of newStyles)
      if (target.getStyle(name) !== value || target.isStyleImportant(name) !== source.isStyleImportant(name)) {
        target._withoutUndoSetStyle(name, value, source.isStyleImportant(name));
        changes.push({ changeType: 'changed', designItems: [target], type: 'css', name });
      }
    syncChildren(target, [...source.children()]);
  };
  const syncChildren = (parent: IDesignItem, sources: IDesignItem[]) => {
    const previous = [...parent.children()];
    const wanted = sources.map((source, index) => {
      const id = source.nodeType === NodeType.Element ? source.id : undefined;
      let target = id && !duplicates.has(id) ? ids.get(id) : undefined;
      const positional = previous[index];
      if (!target && compatible(positional, source) && (!id || positional.id === id)) target = positional;
      if (!target || used.has(target) || !compatible(target, source)) {
        target = source;
        document.rootDesignItem.document.adoptNode(target.node);
        document.rootDesignItem.window.customElements.upgrade(target.node);
        document.serviceContainer.intializationService?.init(target);
        used.add(target);
      } else sync(target, source);
      return target;
    });
    for (const child of previous) if (!wanted.includes(child)) {
      parent._removeChildInternal(child); changes.push({ changeType: 'removed', designItems: [child] });
    }
    for (const [index, child] of wanted.entries()) if (child.parent !== parent || parent.indexOf(child) !== index) {
      parent._insertChildInternal(child, index);
      // Internal moves remove the old extensions too; reapply them after insertion.
      changes.push({ changeType: 'added', designItems: [child] });
    }
  };
  syncChildren(document.rootDesignItem, items);
  const attached = (item: IDesignItem) => { for (let parent = item; parent; parent = parent.parent) if (parent === document.rootDesignItem) return true; return false; };
  const selected = container.selectionService.selectedElements ?? [];
  if (selected.some(item => !attached(item))) container.selectionService.setSelectedElements(selected.filter(attached));
  if (changes.length) container.onContentChanged.emit(changes);
  await document.reparseDocumentStylesheets();
  container.designerCanvas?.extensionManager?.refreshAllAppliedExtentions();
}
