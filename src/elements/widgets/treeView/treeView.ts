import { BaseCustomWebComponentLazyAppend, css, Disposable } from '@node-projects/base-custom-webcomponent';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent';
import { IDesignItem } from '../../item/IDesignItem';
import { DesignItem } from '../../item/DesignItem';
import { ITreeView } from './ITreeView';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';

export class TreeView extends BaseCustomWebComponentLazyAppend implements ITreeView {

  private _items: any;
  private _index: number;
  private _previouslySelected: Element[];
  private _treeDiv: HTMLDivElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;
  private _contentChangedHandler: Disposable;

  private _mapElementTreeitem: Map<Element, HTMLElement>;

  private _rootItem: IDesignItem

  //TODO, buuton so key events can be transfered to designer Cnvas (so you can move controls with keys)

  static override readonly style = css`
    :host {
      --horz-margin: 20px;
      --vert-margin: 0px;
      --horz-shift: calc(var(--horz-margin) / 2); /* typically */
      --vert-shift: 12px;

      display: inline-block;
      position: relative;
      width: 100%;
      height: 100%;
      background: var(--dark-grey, #232733);
      overflow-y: auto;
    }
    button {
      border: none;
      font-size: 13px;
      display: block;
      padding: 4px 0;
      cursor: pointer;
      width: 100%;
      text-align: left;
      display: inline-block;
      margin: 0;
      background: var(--dark-grey, #232733);
      position: relative;
      color: white;
    }
    button:hover, button:focus {
      background: var(--light-grey, #383f52);
    }
    span {
      margin: 4px;
    }
    .id {
      font-style: italic;
      color: var(--highlight-pink, #e91e63);
    }
    .selected {
      background: var(--light-grey, #383f52);
      outline: none;
    }

    li, ul {
      margin: 0;
      padding: 0;
    }
    .tree ul {
      margin-left: var(--horz-margin);
    }
    .tree li {
      list-style-type: none;
      margin-top: var(--vert-margin);
      margin-bottom: var(--vert-margin);
      position: relative;
    }

    /* up connector */
    .tree li::before {
        content: "";
        position: absolute;
        top: calc(0px - var(--vert-margin));
        left: calc(var(--horz-shift) - var(--horz-margin));
        width: calc(var(--horz-margin) - var(--horz-shift));
        height: calc(var(--vert-shift) + var(--vert-margin));
        border-left: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        border-radius: 0;
    }

    /* down connector */
    .tree li::after {
        position: absolute;
        content: "";
        top: var(--vert-shift);
        left: calc(var(--horz-shift) - var(--horz-margin));
        width: calc(var(--horz-margin) - var(--horz-shift));
        height: calc(100% - var(--vert-shift));
        border-left: 1px solid #ccc;
        border-top: 1px solid #ccc;
        border-radius: 0;
    }

    /* do not draw: up connector of first root item */
    ul.tree>li:first-child::before { display:none; }

    /* do not draw: down connector of last item */
    .tree li:last-child::after  { display:none; }

    /* draw rounded: down connector of first root item */
    ul.tree>li:first-child::after { border-radius: 5px 0 0 0; }

    /* draw rounded: up connector of last item */
    .tree li:last-child:before { border-radius: 0 0 0 5px; }
    `;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._treeDiv = document.createElement('div');
    this._treeDiv.style.userSelect = 'none';
    this.shadowRoot.appendChild(this._treeDiv);
    this._treeDiv.addEventListener('click', this._clickElement.bind(this));
  }

  public createTree(rootItem: IDesignItem /*, activeElement: Element */) {
    this._rootItem = rootItem;
    if (rootItem != null)
      this._recomputeTree(rootItem.element, null /*, activeElement */);
  }

  // this.instanceServiceContainer.selectionService.setSelectedElements(null);

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
      this.selectionChanged(e);
    });
    this._contentChangedHandler?.dispose()
    this._contentChangedHandler = this._instanceServiceContainer.contentService.onContentChanged.on(e => {
      this.createTree(value.contentService.rootDesignItem);
    });
    this.createTree(value.contentService.rootDesignItem);
  }

  public selectionChanged(event: ISelectionChangedEvent) {
    this._selectTreeElements(event.selectedElements.map(x => this._mapElementTreeitem.get(x.element)));
  }

  private _recomputeTree(parent, activeElement: Element) {
    this._mapElementTreeitem = new Map<HTMLElement, HTMLElement>();
    this._treeDiv.innerHTML = '';
    let ul = document.createElement('ul');
    ul.classList.add('tree');
    this._treeDiv.appendChild(ul);

    // Since we can't add a pojo to each button, generate a new index for
    // each button in the this.items array of useful data.

    this._index = 0;
    this._items = this._getChildren(parent, ul);

    this._highlight(activeElement);
    return this._items;
  }

  private _makeButton(tag, id, index) {
    let aButton = document.createElement('button');
    aButton.dataset.index = index;
    let aTag = document.createElement('span');
    aTag.className = 'tag';
    aTag.textContent = tag;
    let aId = document.createElement('span');
    aId.className = 'id';
    aId.textContent = id;
    aButton.appendChild(aTag);
    aButton.appendChild(aId);
    return aButton;
  }

  private _getChildren(item, list) {
    // Add item and its children into nested ul list

    let isViewContainer = item.id === 'viewContainer';
    let data = {
      tag: isViewContainer ? 'main-app' : item.tagName.toLowerCase(),
      id: isViewContainer ? '' : (item.id ? '#' + item.id : ''),
      text: isViewContainer ? '' : '"' + item.textContent + '"',
      ref: item,
      index: this._index
    };

    // Add item to list
    let li = document.createElement('li');
    let button = this._makeButton(data.tag, data.id, data.index);
    li.appendChild(button);
    list.appendChild(li);
    this._mapElementTreeitem.set(data.ref, button);

    this._index++;
    let nodes = [data];

    // Add children to subordinate list
    let ul = null;
    for (let i = 0; i < item.children.length; i++) {
      let child = item.children[i];

      // Skip <style> nodes;
      if (child.localName === 'style') {
        continue;
      }

      if (ul == null) {
        ul = document.createElement('ul');
        li.appendChild(ul);
      }
      nodes = nodes.concat(this._getChildren(child, ul));
    }

    return nodes;
  }

  private _clickElement(event) {
    // If the target is a <span>, you clicked on the span inside the button
    // so you need to use currentTarget.
    let item = event.target;
    if (item.localName === 'span') {
      item = item.parentElement;
    }
    this._selectTreeElements([item]);
    this._selectDesignerElement(item);
  }

  private _selectTreeElements(items: Element[]) {
    if (this._previouslySelected) {
      for (let e of this._previouslySelected)
        if (e)
          e.classList.remove('selected');
    }
    this._previouslySelected = items;
    if (items)
      for (let e of items)
        if (e)
          e.classList.add('selected');
  }

  private _selectDesignerElement(item: any) {
    let index = item.dataset.index;
    let el = this._items[index].ref;
    let d = DesignItem.GetOrCreateDesignItem(el, this._rootItem.serviceContainer, this._rootItem.instanceServiceContainer);
    d.instanceServiceContainer.selectionService.setSelectedElements([d]);
  }

  private _highlight(element: Element) {
    if (!element)
      return;
    // Find it in the tree.
    let buttons = this.shadowRoot.querySelectorAll('button');
    if (buttons.length !== this._items.length) {
      return;
    }

    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].ref === element) {
        this._selectTreeElements([buttons[i]]);
        return;
      }
    }
  }
}

customElements.define('node-projects-tree-view', TreeView);