import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class GridAssignedRowColumnPropertyEditor extends BasePropertyEditor<HTMLDivElement> {

  _root: HTMLDivElement;

  constructor(property: IProperty) {
    super(property);
    this._root = document.createElement('div');
    this._root.style.display = 'grid';
    this._root.style.padding = '4px 0px';
    this._root.style.boxSizing = 'border-box';
    this._root.style.minHeight = '50px';
    this.element = this._root;
  }

  refreshValue(valueType: ValueType, value: any) {
    this._root.innerHTML = "";
    if (this.designItems != null && this.designItems.length) {
      let styleContainer = getComputedStyle(this.designItems[0].element.parentElement);
      let style = getComputedStyle(this.designItems[0].element);
      let cntCol = styleContainer.gridTemplateColumns.split(' ').length;
      let cntRow = styleContainer.gridTemplateRows.split(' ').length;
      this._root.style.gridTemplateColumns = 'repeat(' + cntCol + ', 1fr)';
      this._root.style.gridTemplateRows = 'repeat(' + cntRow + ', 1fr)';
      let rowStart = parseInt(style.gridRowStart);
      let rowEnd = style.gridRowEnd == 'auto' ? rowStart : parseInt(style.gridRowEnd);
      rowEnd = rowEnd <= rowStart ? rowStart + 1 : rowEnd;
      let colStart = parseInt(style.gridColumnStart);
      let colEnd = style.gridColumnEnd == 'auto' ? colStart : parseInt(style.gridColumnEnd);
      colEnd = colEnd <= colStart ? colStart + 1 : colEnd;
      for (let p = 1; p <= cntRow; p++) {
        for (let n = 1; n <= cntCol; n++) {
          const b = document.createElement('button');
          b.style.minHeight = '10px';
          b.onclick = () => {
            let grp = this.designItems[0].openGroup('Change grid row/column');
            this.designItems[0].setStyle("grid-row", p + ' / ' + (p + 1));
            this.designItems[0].setStyle("grid-column", n + ' / ' + (n + 1));
            grp.commit();
          }
          if (p >= rowStart && p < rowEnd && n >= colStart && n < colEnd)
            b.style.backgroundColor = 'coral';
          this._root.appendChild(b);
        }
      }
    }
  }
}