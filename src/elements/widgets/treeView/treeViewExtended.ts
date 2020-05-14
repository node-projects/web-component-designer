import { BaseCustomWebComponent, css, html } from '../../controls/BaseCustomWebComponent';
import { ITreeView } from './ITreeView';
import { DesignItem } from '../../item/DesignItem';

export class TreeViewExtended extends BaseCustomWebComponent implements ITreeView {
  public items: any;

  private _index: number;
  private _treeDiv: HTMLDivElement;
  private _tree: Fancytree.Fancytree;

  static readonly style= css`
      span.drag-source {
        border: 1px solid grey;
        border-radius: 3px;
        padding: 2px;
        background-color: silver;
      }

      span.fancytree-node.fancytree-drag-source {
        outline: 1px dotted grey;
      }
      span.fancytree-node.fancytree-drop-accept {
        outline: 1px dotted green;
      }
      span.fancytree-node.fancytree-drop-reject {
        outline: 1px dotted red;
      }
    `;

    static readonly template = html`
      <link rel="stylesheet" href="/node_modules/jquery.fancytree/dist/skin-xp/ui.fancytree.css">
    `;

  constructor() {
    super();

    this._treeDiv = document.createElement('div');
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);
  }


  async ready() {
    this._treeDiv.classList.add('fancytree-connectors');
    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      icon: false, //atm, maybe if we include icons for specific elements
      extensions: ['dnd5'],
      source: []
    });

    //@ts-ignore
    this._tree = $.ui.fancytree.getTree(this._treeDiv);
  }

  public createTree(rootItem: DesignItem): void {
    this._recomputeTree(rootItem.element, null);
  }

  private _recomputeTree(rootElement: Element, activeElement: Element): void {
    this._tree.getRootNode().removeChildren();

    this._index = 0;
    this.items = this._getChildren(rootElement, null);

    this._tree.expandAll();
    this._highlight(activeElement);
  }

  private _getChildren(element: Element, currentNode: Fancytree.FancytreeNode): any {
    if (currentNode == null) {
      currentNode = this._tree.getRootNode();
    }

    const data = {
      tag: element.tagName.toLowerCase(),
      id: element.id ? ('#' + element.id) : '',
      index: this._index,
      ref: element
    };

    this._index++;
    let nodes = [data];

    const newNode = currentNode.addChildren({
      title: data.tag + " " + data.id,
      folder: element.children.length > 0 ? true : false
    });

    for (let i = 0; i < element.children.length; i++) {
      let childElement = element.children[i];
      nodes = nodes.concat(this._getChildren(childElement, newNode));
    }

    return nodes
  }

  private _highlight(activeElement: Element) {
    if (activeElement != null) {
      this._tree.getRootNode().getChildren().forEach(function (node) {
        //@ts-ignore
        if (node.ref === activeElement) {
          node.setSelected(true);
        }
      });
    }
  }
}

customElements.define('node-projects-tree-view-extended', TreeViewExtended);