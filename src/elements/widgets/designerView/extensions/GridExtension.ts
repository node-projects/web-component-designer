import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class GridExtension extends AbstractExtension {

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
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
    let xOffset = itemRect.x - this.designerCanvas.containerBoundingRect.x;
    let yOffset = itemRect.y - this.designerCanvas.containerBoundingRect.y;

    let gridA: string[] = null;
    if (computedStyle.gridTemplateAreas && computedStyle.gridTemplateAreas !== 'none')
      gridA = computedStyle.gridTemplateAreas.split('\"');
    if (computedStyle.columnGap && computedStyle.columnGap != 'normal')
      xGap = Number.parseFloat(computedStyle.columnGap.replace('px', ''));
    if (computedStyle.rowGap && computedStyle.rowGap != 'normal')
      yGap = Number.parseFloat(computedStyle.rowGap.replace('px', ''));

    let gesX = 0;
    let gesY = 0;
    for (let c of columns) {
      const currX = Number.parseFloat(c.replace('px', ''));
      gesX += currX + xGap;
    }
    gesX -= xGap;
    for (let r of rows) {
      const currY = Number.parseFloat(r.replace('px', ''));
      gesY += currY + yGap;
    }
    gesY -= yGap;

    if (computedStyle.justifyContent == 'center') {
      xOffset += (itemRect.width - gesX) / 2;
    } else if (computedStyle.justifyContent == 'end') {
      xOffset += itemRect.width - gesX;
    } else if (computedStyle.justifyContent == 'space-between') {
      xGap += (itemRect.width - gesX) / (columns.length - 1);
    } else if (computedStyle.justifyContent == 'space-around') {
      let gp = (itemRect.width - gesX) / (columns.length * 2);
      xGap += gp * 2;
      xOffset += gp;
    } else if (computedStyle.justifyContent == 'space-evenly') {
      let gp = (itemRect.width - gesX) / (columns.length + 1);
      xGap += gp;
      xOffset += gp;
    }

    if (computedStyle.alignContent == 'center') {
      xOffset += (itemRect.height - gesY) / 2;
    } else if (computedStyle.alignContent == 'end') {
      xOffset += itemRect.height - gesY;
    } else if (computedStyle.alignContent == 'space-between') {
      yGap += (itemRect.height - gesY) / (rows.length - 1);
    } else if (computedStyle.alignContent == 'space-around') {
      let gp = (itemRect.height - gesY) / (rows.length * 2);
      yGap += gp * 2;
      yOffset += gp;
    } else if (computedStyle.alignContent == 'space-evenly') {
      let gp = (itemRect.height - gesY) / (rows.length + 1);
      yGap += gp;
      yOffset += gp;
    }

    for (let xIdx = 0; xIdx < rows.length; xIdx++) {
      const r = rows[xIdx];
      let areas: string[] = null;
      if (gridA) {
        areas = gridA[rw + 1].split(' ');
      }
      let x = 0;
      let cl = 0;
      const currY = Number.parseFloat(r.replace('px', ''));
      for (let yIdx = 0; yIdx < columns.length; yIdx++) {
        const c = columns[yIdx];
        if (x > 0 && xGap) {
          this._drawRect(x + xOffset, y + yOffset, xGap, currY, 'svg-grid-gap', null, OverlayLayer.Background);
          x += xGap
        }
        const currX = Number.parseFloat(c.replace('px', ''));
        if (y > 0 && yGap) {
          this._drawRect(x + xOffset, y + yOffset - yGap, currX, yGap, 'svg-grid-gap', null, OverlayLayer.Background);
        }
        if (areas) {
          const nm = areas[cl].trim();
          if (nm != '.') {
            const text = this._drawText(nm, x + xOffset, y + yOffset, 'svg-grid-area', null, OverlayLayer.Background);
            text.setAttribute("dominant-baseline", "hanging");
          }
        }
        this._drawRect(x + xOffset, y + yOffset, currX, currY, 'svg-grid', null, OverlayLayer.Background);
        x += currX;
        cl++;
      }
      y += currY + yGap;
      rw += 2;
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