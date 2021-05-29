import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class GridExtension extends AbstractExtension {

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const rows = computedStyle.gridTemplateRows.split(' ');
    const columns = computedStyle.gridTemplateColumns.split(' ');

    let y = 0;
    let xGap = 0;
    let yGap = 0;
    let rw = 0;
    const xOffset = itemRect.x - this.designerView.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerView.containerBoundingRect.y;

    let gridA: string[] = null;
    if (computedStyle.gridTemplateAreas && computedStyle.gridTemplateAreas !== 'none')
      gridA = computedStyle.gridTemplateAreas.split('\"');
    if (computedStyle.columnGap) {
      xGap = Number.parseInt(computedStyle.columnGap.replace('px', ''));
      if (computedStyle.rowGap) {
        yGap = Number.parseInt(computedStyle.rowGap.replace('px', ''));
        for (let r of rows) {
          let areas: string[] = null;
          if (gridA) {
            areas = gridA[rw + 1].split(' ');
          }
          let x = 0;
          let cl = 0;
          const currY = Number.parseInt(r.replace('px', ''));
          for (let c of columns) {

            if (x > 0 && xGap) {
              this._drawRect(x + xOffset, y + yOffset, xGap, currY, 'svg-grid-gap');
              x += xGap
            }
            const currX = Number.parseInt(c.replace('px', ''));
            if (y > 0 && yGap) {
              this._drawRect(x + xOffset, y + yOffset - yGap, currX, yGap, 'svg-grid-gap');
            }
            if (areas) {
              const nm = areas[cl].trim();
              if (nm != '.') {
                const text = this._drawText(nm, x + xOffset, y + yOffset, 'svg-grid-area');
                text.setAttribute("dominant-baseline", "hanging");
              }
            }
            this._drawRect(x + xOffset, y + yOffset, currX, currY, 'svg-grid');
            x += currX;
            cl++;
          }
          y += currY + yGap;
          rw += 2;
        }
      }
    }
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}