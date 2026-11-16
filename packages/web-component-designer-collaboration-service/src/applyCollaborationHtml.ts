import { CssStyleChangeAction, getDesignItemByCollaborationNodeIndex, NodeType, TextContentChangeAction } from '@node-projects/web-component-designer';
import type { EditingDocument, IContentChanged, IDesignItem } from '@node-projects/web-component-designer';
import { mergeCollaborationHtml } from './mergeCollaborationHtml.js';

function syncProperties(target: IDesignItem, source: IDesignItem, changes: IContentChanged[], attributesChanged?: (item: IDesignItem) => void) {
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
    changes.push(...new CssStyleChangeAction(target, name, null, target.getStyle(name), false, target.isStyleImportant(name)).do());
  }
  for (const [name, value] of newStyles)
    if (target.getStyle(name) !== value || target.isStyleImportant(name) !== source.isStyleImportant(name)) {
      // Apply to the live element as well as the model, without adding local undo history.
      changes.push(...new CssStyleChangeAction(target, name, value, target.getStyle(name), source.isStyleImportant(name), target.isStyleImportant(name)).do());
    }
}

// Only optimize one changed opening tag with byte-identical surrounding markup.
async function applySingleElementProperties(document: EditingDocument, before: string, html: string, attributesChanged?: (item: IDesignItem) => void): Promise<boolean> {
  // Raw-text elements and comments may contain opening-tag-like text rather than nodes.
  if (/<!--|<(?:script|style|textarea|title|xmp|iframe|noembed|noframes|plaintext)\b/i.test(before)) return false;
  let first = 0;
  while (first < before.length && before[first] === html[first]) first++;
  const start = before.lastIndexOf('<', first);
  if (start < 0 || html.lastIndexOf('<', first) !== start) return false;
  const endOfTag = (text: string, tagStart = start) => {
    let quote = '';
    for (let index = tagStart + 1; index < text.length; index++) {
      const char = text[index];
      if (quote) { if (char === quote) quote = ''; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') return index + 1;
    }
    return -1;
  };
  const endBefore = endOfTag(before), endAfter = endOfTag(html);
  if (endBefore < first || endAfter < first || before.slice(endBefore) !== html.slice(endAfter)) return false;
  const oldTag = before.slice(start, endBefore), newTag = html.slice(start, endAfter);
  const oldName = /^<([a-z][\w:-]*)\b/i.exec(oldTag)?.[1];
  const newName = /^<([a-z][\w:-]*)\b/i.exec(newTag)?.[1];
  if (!oldName || oldName !== newName || /^(style|script|template|textarea)$/i.test(oldName)) return false;
  // The unchanged prefix/suffix prove that structure is identical. Count opening
  // tags in that exact revision and resolve the same preorder position on the model.
  let nodeIndex = 0;
  for (let offset = 0; offset < start;) {
    const tagStart = before.indexOf('<', offset);
    if (tagStart < 0 || tagStart >= start) break;
    const end = endOfTag(before, tagStart);
    if (end < 0 || end > start) return false;
    if (/^<[a-z][\w:-]*\b/i.test(before.slice(tagStart, end))) nodeIndex++;
    offset = end;
  }
  const target = getDesignItemByCollaborationNodeIndex(document.rootDesignItem, nodeIndex);
  if (!target || target.name.toLowerCase() !== oldName.toLowerCase()) return false;
  const svg = target.element.namespaceURI === 'http://www.w3.org/2000/svg';
  if (!svg && target.element.namespaceURI !== 'http://www.w3.org/1999/xhtml') return false;
  const snippet = newTag + '</' + newName + '>';
  // Watch authoritative document edits while parsing yields, rather than writing
  // the entire unchanged document a second time just to detect a concurrent edit.
  let changedWhileParsing = false;
  const subscription = document.instanceServiceContainer.onContentChanged.on(() => { changedWhileParsing = true; });
  let items: IDesignItem[];
  try { items = await document.serviceContainer.htmlParserService.parse(svg ? '<svg>' + snippet + '</svg>' : snippet, document.serviceContainer, document.instanceServiceContainer, false); }
  finally { subscription.dispose(); }
  const source = svg ? items[0]?.firstChild : items[0];
  if (items.length !== 1 || !source || source.name !== target.name || changedWhileParsing) return false;
  const changes: IContentChanged[] = [];
  syncProperties(target, source, changes, attributesChanged);
  if (changes.length) {
    document.instanceServiceContainer.onContentChanged.emit(changes);
    document.instanceServiceContainer.designerCanvas?.extensionManager?.refreshExtension(target);
  }
  return true;
}

/** Apply shared HTML without replacing unchanged items, active selections or an in-progress drag.
 * currentHtml may provide an authoritative, already-flushed snapshot of this document.
 */
export async function applyCollaborationHtml(document: EditingDocument, html: string, attributesChanged?: (item: IDesignItem) => void, currentHtml?: string): Promise<void> {
  const container = document.instanceServiceContainer;
  let before = currentHtml ?? document.getHtml();
  if (before === html || await applySingleElementProperties(document, before, html, attributesChanged)) return;
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
    syncProperties(target, source, changes, attributesChanged);
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
