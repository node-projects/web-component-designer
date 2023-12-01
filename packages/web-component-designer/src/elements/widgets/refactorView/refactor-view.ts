import { BaseCustomWebComponentConstructorAppend, css, html, Disposable } from '@node-projects/base-custom-webcomponent';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IRefactoring } from '../../services/refactorService/IRefactoring.js';

export class RefactorView extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
    <div id="root">
      <template repeat:item="[[this.refactorings]]">
        <details>
          <summary style="display: flex;">
              name:<input value="[[item[0]]]" @keydown="[[this._refactor(item, event)]]" style="flex-grow: 1; min-width: 0">
          </summary>
          <ul>
            <template repeat:reft="[[item[1]]]">
              <li>[[reft.type]] - [[reft.display]]</li>
            </template>
          </ul>
        </details>
      </template>
    </div>`;

  static override readonly style = css`
    :host {
        box-sizing: border-box;      
        font-family: monospace;  
        height: 100%;
        width: 100%;
        position: absolute;
        overflow: hidden;
    }
    
    ul {
      margin: 4px;
      padding-left: 30px;
      font-size: 10px;
    }
    
    #root {
      padding: 5px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      height: calc(100% - 10px);
    }`;

  static readonly is = 'node-projects-refactor-view';

  static readonly properties = {
  }

  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;
  private _selectedItems: IDesignItem[];

  public refactorings = new Map<string, IRefactoring[]>();;

  ready() {
    this._bindingsParse();
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
      this.selectedItems = e.selectedElements;
    });
    this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
  }

  get selectedItems() {
    return this._selectedItems;
  }
  set selectedItems(items: IDesignItem[]) {
    if (this._selectedItems != items) {
      this._selectedItems = items;

      this.updateRefactorlist(this._selectedItems);
    }
  }

  public _refactor(refactoring: [string, IRefactoring[]], event: KeyboardEvent) {
    const ip = event.target as HTMLInputElement;
    if (event.key == 'Enter') {
      for (let r of refactoring[1]) {
        r.service.refactor(r, r.name, ip.value);
      }
    }
  }

  updateRefactorlist(designItems: IDesignItem[]) {
    this.refactorings.clear();

    if (designItems && designItems.length) {
      let refactorings: IRefactoring[] = []
      const serviceContainer = designItems[0].serviceContainer;
      for (let s of serviceContainer.refactorServices) {
        let rfs = s.getRefactorings(designItems);
        refactorings.push(...rfs);
      }

      //Group refactorings by name
      for (const r of refactorings) {
        let thisList = this.refactorings.get(r.name);
        if (thisList === undefined) {
          thisList = [];
          this.refactorings.set(r.name, thisList);
        }
        thisList.push(r);
      }
    }

    this._bindingsRefresh();
  }
}

customElements.define(RefactorView.is, RefactorView);