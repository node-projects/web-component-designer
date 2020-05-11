import { BaseCustomWebComponent, css } from './controls/BaseCustomWebComponent';
import 'jquery.fancytree/dist/jquery.fancytree-all-deps';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';

export class TreeViewExtended extends BaseCustomWebComponent {
  items: any;
  _index: number;
  _previouslySelected: HTMLInputElement;
  _treeDiv: HTMLDivElement;
  _tree: Fancytree.Fancytree;

  static get style() {
    return css`
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
  }

  constructor() {
    super();

    this._treeDiv = document.createElement('div');
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "/node_modules/jquery.fancytree/dist/skin-lion/ui.fancytree.css";
    this.shadowRoot.appendChild(linkElement);
  }

  async connectedCallback() {
    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      extensions: ['dnd5'],
      source: [
        {title: "Node 1", key: "1"},
        {title: "Folder 2", key: "2", folder: true, children: [
          {title: "Node 2.1", key: "3"},
          {title: "Node 2.2", key: "4"}
        ]}
      ]
    });
    
    //@ts-ignore
    this._tree = $.ui.fancytree.getTree(this._treeDiv);
  }

  public createTree(rootElement: Element, activeElement: Element): void {
    this._recomputeTree(rootElement, activeElement);
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
      this._tree.getRootNode().getChildren().forEach(function(node) {
        //@ts-ignore
        if (node.ref === activeElement) {
          node.setSelected(true);
        }
      });
    }
  }
}

customElements.define('node-projects-tree-view-extended', TreeViewExtended);