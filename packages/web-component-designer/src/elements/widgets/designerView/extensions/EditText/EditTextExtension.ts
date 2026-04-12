import { html, Disposable } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension, toolbarObject } from "../AbstractExtension.js";
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";
import { shadowrootGetSelection, wrapSelectionInSpans } from "../../../../helper/SelectionHelper.js";
import { FontPropertyEditor } from "../../../../services/propertiesService/propertyEditors/FontPropertyEditor.js";
import { getBoundingClientRectAlsoForDisplayContents } from "../../../../helper/ElementHelper.js";

export type handlesPointerEvent = { handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean }

export class EditTextExtension extends AbstractExtension implements handlesPointerEvent {

  private static template = html`
    <div style="height: 100%; display: flex; gap: 2px; width: 100%;">
      <button data-command="font-weight" data-command-parameter="800" style="pointer-events: auto; height: 24px; width: 24px; padding: 0; font-weight: 900;">b</button>
      <button data-command="font-style" data-command-parameter="italic" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><em>i</em></button>
      <button data-command="text-decoration" data-command-parameter="underline" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><ins>u</ins></button>
      <button data-command="text-decoration" data-command-parameter="line-through" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><del>s</del></button>
      <button data-command="text-decoration" data-command-parameter="overline" style="pointer-events: auto; height: 24px; width: 24px; padding: 0;"><span style="text-decoration: overline">o</span></button>
      <select data-command="fontSize" style="pointer-events: auto; height: 24px; width: 60px; padding: 0;">
        <option>8px</option>
        <option>9px</option>
        <option>10px</option>
        <option>11px</option>
        <option>12px</option>
        <option>14px</option>
        <option>16px</option>
        <option>18px</option>
        <option>20px</option>
        <option>24px</option>
        <option>28px</option>
        <option>32px</option>
        <option>36px</option>
      </select>
      <select id="fontFamily" data-command="font-family" style="pointer-events: auto; height: 24px; width: 90px; padding: 0;">
        
      </select>
    </div>
  `;

  private _path!: SVGPathElement;
  private _toolbar!: toolbarObject;
  private _selectionChangedListener?: Disposable;
  private _toolbarStateAnimationFrame?: number;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._keyDown = this._keyDown.bind(this);
    this._scheduleToolbarStateRefresh = this._scheduleToolbarStateRefresh.bind(this);
  }

  private _keyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.dispose();
    }
  }

  override extend() {
    //TODO: -> check what to do with extensions, do not loose edit on mouse click,...
    //maybe use a html edit framework
    this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
    this.extendedItem.removeDesignerAttributesAndStylesFromChildren();
    window.addEventListener('keydown', this._keyDown, true);
    //@ts-ignore
    this.extendedItem.editContent();

    this._selectionChangedListener = this.extendedItem.instanceServiceContainer.selectionService.onSelectionChanged.on(() => {
      this.commitchanges();
      this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    });

    (<HTMLElement>this.extendedItem.element).focus();

    let itemRect = getBoundingClientRectAlsoForDisplayContents(this.extendedItem.element);

    this._toolbar = this.createToolbar(EditTextExtension.template, 300, 24);
    this._toolbar.updatePosition({ x: (itemRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, y: ((itemRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 36) });

    FontPropertyEditor.addFontsToSelect(this._toolbar.getById<HTMLSelectElement>('fontFamily'));
    this._toolbar.querySelectorAll('button').forEach(x => x.onpointerdown = (e) => {
      const command = x.dataset['command'];
      if (command)
        this._formatSelection(command, x.dataset['commandParameter']);
    });
    this._toolbar.querySelectorAll('select').forEach(x => x.onchange = () => {
      const command = x.dataset['command'];
      if (command)
        this._formatSelection(command, x.value);
    });

    document.addEventListener('selectionchange', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.addEventListener('keyup', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.addEventListener('pointerup', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.addEventListener('input', this._scheduleToolbarStateRefresh, true);

    //TODO - nice way to disable click overlay
    this.designerCanvas.clickOverlay.style.pointerEvents = 'none';

    //overlay to detect click outside
    this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this._path.setAttribute('class', 'svg-edit-text-clickoutside');
    this._path.setAttribute('fill-rule', 'evenodd');
    this._path.style.pointerEvents = 'auto';
    this._path.onpointerdown = (e) => {
      this.designerCanvas.ignoreEvent(e);
      this.commitchanges();
      this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    }
    this._addOverlay(this._path, OverlayLayer.Background);
    this.refresh();
    this._refreshToolbarState();
  }

  override refresh() {
    const p = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (this._valuesHaveChanges(this.designerCanvas.containerBoundingRect.width, this.designerCanvas.containerBoundingRect.height, this.designerCanvas.scaleFactor, p.p1.x, p.p1.y, p.p2.x, p.p2.y, p.p3.x, p.p3.y, p.p4.x, p.p4.y)) {
      let outsideRect = { width: this.designerCanvas.containerBoundingRect.width / this.designerCanvas.scaleFactor, height: this.designerCanvas.containerBoundingRect.height / this.designerCanvas.scaleFactor };
      let data = "M0 0 L" + outsideRect.width + " 0 L" + outsideRect.width + ' ' + outsideRect.height + " L0 " + outsideRect.height + " Z ";
      data += "M" + [p.p1, p.p2, p.p3, p.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
      this._path.setAttribute("d", data);
    }
  }

  override dispose() {
    window.removeEventListener('keydown', this._keyDown, true);
    document.removeEventListener('selectionchange', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.removeEventListener('keyup', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.removeEventListener('pointerup', this._scheduleToolbarStateRefresh, true);
    this.extendedItem.element.removeEventListener('input', this._scheduleToolbarStateRefresh, true);
    if (this._toolbarStateAnimationFrame != null)
      cancelAnimationFrame(this._toolbarStateAnimationFrame);
    this._selectionChangedListener?.dispose();
    this._removeAllOverlays();
    this.extendedItem.editContentFinish();
    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  commitchanges() {
    this._removeAllOverlays();

    this.extendedItem.element.normalize();
    this._cleanupFormattingMarkup(this.extendedItem.element);
    this.extendedItem.element.normalize();
    let stop = false;
    outer:
    while (!stop) {
      for (let e of this.extendedItem.element.querySelectorAll('*')) {
        if (e.childNodes.length == 0) {
          e.remove();
          continue outer;
        }
      }
      stop = true;
    }
    this._cleanupFormattingMarkup(this.extendedItem.element);
    this.extendedItem.element.normalize();

    const newHTML = this.extendedItem.element.innerHTML;

    this.extendedItem.editContentFinish();
    this.extendedItem.innerHTML = newHTML;

    this.designerCanvas.clickOverlay.style.pointerEvents = 'auto';
  }

  private _cleanupFormattingMarkup(root: Element) {
    let changed = false;
    do {
      changed = this._cleanupFormattingNode(root);
      root.normalize();
    } while (changed);
  }

  private _cleanupFormattingNode(node: Node): boolean {
    let changed = false;
    for (const child of Array.from(node.childNodes)) {
      changed = this._cleanupFormattingNode(child) || changed;
    }

    if (node instanceof HTMLElement && node.localName === 'span') {
      const span = node as HTMLSpanElement;
      if (this._isRedundantSpan(span)) {
        this._unwrapElement(span);
        return true;
      }

      const parent = span.parentElement;
      if (parent instanceof HTMLElement && parent.localName === 'span' && this._haveSameAttributes(parent, span)) {
        this._unwrapElement(span);
        return true;
      }
    }

    return this._mergeAdjacentSpans(node) || changed;
  }

  private _mergeAdjacentSpans(node: Node): boolean {
    let changed = false;
    let current = node.firstChild;
    while (current) {
      if (current instanceof HTMLElement && current.localName === 'span') {
        let next = current.nextSibling;
        while (next instanceof HTMLElement && next.localName === 'span' && this._haveSameAttributes(current, next)) {
          while (next.firstChild) {
            current.appendChild(next.firstChild);
          }
          next.remove();
          changed = true;
          next = current.nextSibling;
        }
      }
      current = current.nextSibling;
    }
    return changed;
  }

  private _isRedundantSpan(span: HTMLSpanElement): boolean {
    return this._getAttributeSignature(span) === '';
  }

  private _haveSameAttributes(left: HTMLSpanElement, right: HTMLSpanElement): boolean {
    return this._getAttributeSignature(left) === this._getAttributeSignature(right);
  }

  private _getAttributeSignature(element: Element): string {
    return Array.from(element.attributes)
      .filter(attribute => attribute.name !== 'style' || attribute.value.trim() !== '')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(attribute => `${attribute.name}=${attribute.value}`)
      .join(';');
  }

  private _unwrapElement(element: Element) {
    const parent = element.parentNode;
    if (!parent)
      return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    element.remove();
  }

  handlesPointerEvent(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element): boolean {
    const p = event.composedPath();
    const stylo = this._toolbar?.querySelector('stylo-editor');
    return stylo != null && p.indexOf(stylo) >= 0;
  }

  _formatSelection(type: string, value?: string) {
    const shadowRoot = this.designerCanvas.rootDesignItem.element.shadowRoot;
    if (!shadowRoot)
      return;

    const selection = shadowrootGetSelection(shadowRoot);
    if (!selection)
      return;

    const unset = this._isFormatApplied(selection, type, value);

    const spans = wrapSelectionInSpans(selection);
    if (!spans.length)
      return;

    for (const span of spans) {
      if (unset) {
        const targets = this._findFormatTargets(span, type, value);
        if (targets.length) {
          for (const target of targets)
            this._unsetFormat(target, type, value);
        } else {
          this._unsetFormat(span, type, value);
        }
      } else {
        this._setFormat(span, type, value);
      }
    }

    (<HTMLElement>this.extendedItem.element).focus();
    this._restoreSelection(spans);
    this._refreshToolbarState();
  }

  private _scheduleToolbarStateRefresh() {
    if (this._toolbarStateAnimationFrame != null)
      cancelAnimationFrame(this._toolbarStateAnimationFrame);

    this._toolbarStateAnimationFrame = requestAnimationFrame(() => {
      this._toolbarStateAnimationFrame = undefined;
      this._refreshToolbarState();
    });
  }

  private _refreshToolbarState() {
    const element = this._getToolbarStateElement();
    const computedStyle = getComputedStyle(element);
    const decorations = this._getTextDecorationValues(computedStyle.textDecorationLine || computedStyle.textDecoration);

    this._setToolbarButtonState('font-weight', '800', this._isComputedFormatApplied(computedStyle, 'font-weight', '800'));
    this._setToolbarButtonState('font-style', 'italic', this._isComputedFormatApplied(computedStyle, 'font-style', 'italic'));
    this._setToolbarButtonState('text-decoration', 'underline', decorations.includes('underline'));
    this._setToolbarButtonState('text-decoration', 'line-through', decorations.includes('line-through'));
    this._setToolbarButtonState('text-decoration', 'overline', decorations.includes('overline'));

    this._setToolbarSelectValue(this._getToolbarSelect('fontSize'), computedStyle.fontSize);
    this._setToolbarFontFamilyValue(this._getToolbarSelect('font-family'), computedStyle.fontFamily);
  }

  private _getToolbarStateElement(): HTMLElement {
    const selection = this._getEditableSelection();
    const element = selection ? this._getFirstSelectedElement(selection) : null;
    if (element && this.extendedItem.element.contains(element))
      return element;

    return this.extendedItem.element as HTMLElement;
  }

  private _isComputedFormatApplied(computedStyle: CSSStyleDeclaration, type: string, value?: string): boolean {
    switch (type) {
      case 'font-weight': {
        if (computedStyle.fontWeight === 'bold')
          return true;
        const numericWeight = parseFloat(computedStyle.fontWeight);
        if (Number.isNaN(numericWeight))
          return false;
        return value ? numericWeight >= parseFloat(value) : numericWeight >= 600;
      }
      case 'font-style':
        return computedStyle.fontStyle === value;
      case 'text-decoration':
        return !!value && this._getTextDecorationValues(computedStyle.textDecorationLine).includes(value);
      case 'fontSize':
        return computedStyle.fontSize === value;
      case 'font-family':
        return !!value && this._normalizeFontFamily(computedStyle.fontFamily) === this._normalizeFontFamily(value);
      default:
        return value != null && computedStyle.getPropertyValue(type) === value;
    }
  }

  private _getToolbarSelect(command: string): HTMLSelectElement | null {
    return this._toolbar.querySelector(`select[data-command="${command}"]`);
  }

  private _setToolbarButtonState(command: string, parameter: string, active: boolean) {
    const button = this._toolbar.querySelector<HTMLButtonElement>(`button[data-command="${command}"][data-command-parameter="${parameter}"]`);
    if (!button)
      return;

    button.toggleAttribute('data-active', active);
    button.ariaPressed = String(active);
    button.style.backgroundColor = active ? 'rgb(191, 219, 254)' : '';
    button.style.boxShadow = active ? 'inset 0 0 0 1px rgb(59, 130, 246)' : '';
  }

  private _setToolbarSelectValue(select: HTMLSelectElement | null, value: string) {
    if (!select)
      return;

    this._removeTemporarySelectOptions(select);
    const option = Array.from(select.options).find(x => x.value === value);
    if (option) {
      select.value = option.value;
      return;
    }

    if (!value) {
      select.selectedIndex = -1;
      return;
    }

    const dynamicOption = document.createElement('option');
    dynamicOption.value = value;
    dynamicOption.text = value;
    dynamicOption.dataset['temporaryToolbarValue'] = 'true';
    select.appendChild(dynamicOption);
    select.value = value;
  }

  private _setToolbarFontFamilyValue(select: HTMLSelectElement | null, value: string) {
    if (!select)
      return;

    const primaryFamily = this._getPrimaryFontFamily(value);
    const normalizedPrimaryFamily = this._normalizeFontFamily(primaryFamily);

    this._removeTemporarySelectOptions(select);
    const option = Array.from(select.options).find(x => this._normalizeFontFamily(x.value) === normalizedPrimaryFamily);
    if (option) {
      select.value = option.value;
      return;
    }

    if (!primaryFamily) {
      select.selectedIndex = -1;
      return;
    }

    const dynamicOption = document.createElement('option');
    dynamicOption.value = primaryFamily;
    dynamicOption.text = primaryFamily;
    dynamicOption.dataset['temporaryToolbarValue'] = 'true';
    select.appendChild(dynamicOption);
    select.value = primaryFamily;
  }

  private _removeTemporarySelectOptions(select: HTMLSelectElement) {
    Array.from(select.options)
      .filter(x => x.dataset['temporaryToolbarValue'] === 'true')
      .forEach(x => x.remove());
  }

  private _getPrimaryFontFamily(value: string): string {
    return value.replaceAll(/['"]/g, '').split(',')[0].trim();
  }

  private _restoreSelection(spans: HTMLSpanElement[]) {
    const selection = this._getEditableSelection();
    if (!selection)
      return;

    const range = document.createRange();
    range.setStartBefore(spans[0]);
    range.setEndAfter(spans[spans.length - 1]);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private _getEditableSelection(): Selection | null {
    const shadowRoot = this.designerCanvas.rootDesignItem.element.shadowRoot;
    if (!shadowRoot)
      return document.getSelection();

    const selection = shadowrootGetSelection(shadowRoot);
    if (selection && 'addRange' in selection && 'removeAllRanges' in selection)
      return selection;
    return document.getSelection();
  }

  private _isFormatApplied(selection: Selection | ArrayLike<StaticRange>, type: string, value?: string): boolean {
    const element = this._getFirstSelectedElement(selection);
    if (!element)
      return false;

    return this._isComputedFormatApplied(getComputedStyle(element), type, value);
  }

  private _getFirstSelectedElement(selection: Selection | ArrayLike<StaticRange>): HTMLElement | null {
    const range = this._getSelectionRange(selection);
    if (!range)
      return null;

    if (range.startContainer.nodeType === Node.TEXT_NODE)
      return range.startContainer.parentElement;

    const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

    if (!root)
      return range.startContainer instanceof HTMLElement ? range.startContainer : null;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const textNode = node as Text;
        if (!textNode.textContent?.length)
          return NodeFilter.FILTER_SKIP;
        return range.intersectsNode(textNode) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    const firstTextNode = (root.nodeType === Node.TEXT_NODE && range.intersectsNode(root))
      ? root as Text
      : walker.nextNode() as Text | null;

    if (firstTextNode?.parentElement)
      return firstTextNode.parentElement;

    return range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
  }

  private _getSelectionRange(selection: Selection | ArrayLike<StaticRange>): Range | null {
    if ('getRangeAt' in selection) {
      if (!selection.rangeCount)
        return null;
      return selection.getRangeAt(0);
    }

    const staticRange = selection[0];
    if (!staticRange)
      return null;

    const range = document.createRange();
    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);
    return range;
  }

  private _findFormatTargets(span: HTMLSpanElement, type: string, value?: string): HTMLElement[] {
    const targets: HTMLElement[] = [];
    let current: HTMLElement | null = span;
    while (current && current !== this.extendedItem.element) {
      if (this._hasInlineFormat(current, type, value))
        targets.push(current);
      current = current.parentElement;
    }
    return targets;
  }

  private _hasInlineFormat(element: HTMLElement, type: string, value?: string): boolean {
    switch (type) {
      case 'font-weight':
        return element.style.fontWeight !== '';
      case 'font-style':
        return element.style.fontStyle !== '';
      case 'text-decoration':
        return !!value && this._getTextDecorationValues(element.style.textDecorationLine || element.style.textDecoration).includes(value);
      case 'fontSize':
        return element.style.fontSize !== '';
      case 'font-family':
        return element.style.fontFamily !== '';
      default:
        return element.style.getPropertyValue(type) !== '';
    }
  }

  private _setFormat(element: HTMLElement, type: string, value?: string) {
    switch (type) {
      case 'font-weight':
        element.style.fontWeight = value ?? '';
        break;
      case 'font-style':
        element.style.fontStyle = value ?? '';
        break;
      case 'text-decoration': {
        const decorations = this._getTextDecorationValues(element.style.textDecorationLine || element.style.textDecoration);
        if (value && !decorations.includes(value))
          decorations.push(value);
        element.style.textDecorationLine = decorations.join(' ');
        break;
      }
      case 'fontSize':
        element.style.fontSize = value ?? '';
        break;
      case 'font-family':
        element.style.fontFamily = value ?? '';
        break;
      default:
        if (value == null)
          element.style.removeProperty(type);
        else
          element.style.setProperty(type, value);
        break;
    }
  }

  private _unsetFormat(element: HTMLElement, type: string, value?: string) {
    switch (type) {
      case 'font-weight':
        element.style.removeProperty('font-weight');
        break;
      case 'font-style':
        element.style.removeProperty('font-style');
        break;
      case 'text-decoration': {
        const decorations = this._getTextDecorationValues(element.style.textDecorationLine || element.style.textDecoration)
          .filter(decoration => decoration !== value);
        if (decorations.length)
          element.style.textDecorationLine = decorations.join(' ');
        else {
          element.style.removeProperty('text-decoration-line');
          element.style.removeProperty('text-decoration');
        }
        break;
      }
      case 'fontSize':
        element.style.removeProperty('font-size');
        break;
      case 'font-family':
        element.style.removeProperty('font-family');
        break;
      default:
        element.style.removeProperty(type);
        break;
    }
  }

  private _getTextDecorationValues(value: string | null | undefined): string[] {
    if (!value)
      return [];
    return value.split(' ').map(x => x.trim()).filter(x => x.length > 0 && x !== 'none' && x !== 'solid');
  }

  private _normalizeFontFamily(value: string): string {
    return value.replaceAll(/['"]/g, '').split(',')[0].trim().toLowerCase();
  }
}