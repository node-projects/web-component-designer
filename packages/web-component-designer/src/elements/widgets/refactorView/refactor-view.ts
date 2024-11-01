import { BaseCustomWebComponentConstructorAppend, css, html, Disposable } from '@node-projects/base-custom-webcomponent';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IRefactoring } from '../../services/refactorService/IRefactoring.js';
import { ChangeGroup } from '../../services/undoService/ChangeGroup.js';

export class RefactorView extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
    <div id="root">
      <div class="search">
        <span>search</span>
        <input style="flex-grow: 1; min-width: 0" value="{{this.searchText}}">
        <span>replace</span>
        <input style="flex-grow: 1; min-width: 0"value="{{this.replaceText}}">
        <button @click="[[this.replace()]]" style="grid-column: 2;">replace</button>
      </div>
      <hr>
      <template repeat:item="[[this.refactorings]]">
        <details open>
          <summary>
              [[item[1][0].itemType]]-name:<input value="[[item[1][0].name]]" @keydown="[[this._refactor(item, event)]]" style="flex-grow: 1; min-width: 0">
          </summary>
          <ul>
            <template repeat:reft="[[item[1]]]">
              <li>[[reft.type]]/[[reft.display]]</li>
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

    .search {
      display: grid;
      grid-template-columns: 40px 1fr;
      align-items: center;
    }

    span {
      font-size: 10px;
    }

    summary {
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      white-space: nowrap;
    }
    
    ul {
      margin: 4px;
      padding-left: 20px;
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

  public searchText: string = "(.*)";
  public replaceText: string = "$1";


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

  public replace() {
    let grp: ChangeGroup = null;
    for (let r of this.refactorings) {
      let n = r[1][0].name;
      const regex = new RegExp(this.searchText);
      const found = n.match(regex);
      if (found) {
        if (!grp)
          grp = r[1][0].designItem.openGroup('refactor with regex ' + this.searchText + " -> " + this.replaceText);
        const newText = n.replace(regex, this.replaceText);
        if (newText != n) {
          this.applyRefactoring(r, newText)
        }
      }
    }
    if (!grp)
      grp.commit();
  }

  public _refactor(refactoring: [string, IRefactoring[]], event: KeyboardEvent) {
    const ip = event.target as HTMLInputElement;
    if (event.key == 'Enter') {
      this.applyRefactoring(refactoring, ip.value);
    }
  }

  public applyRefactoring(refactoring: [string, IRefactoring[]], newValue: string) {
    const grp = refactoring[1][0].designItem.openGroup('refactor ' + refactoring[1][0].name + ' to ' + newValue);
    for (let r of refactoring[1]) {
      r.service.refactor(r, r.name, newValue);
    }
    grp.commit();
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
      //TODO: group also by itemType, cause different item types (for example screen and signal name) could have the same string
      for (const r of refactorings) {
        let thisList = this.refactorings.get(r.itemType + '|' + r.name);
        if (thisList === undefined) {
          thisList = [];
          this.refactorings.set(r.itemType + '|' + r.name, thisList);
        }
        thisList.push(r);
      }
    }

    this._bindingsRefresh();
  }
}

customElements.define(RefactorView.is, RefactorView);