import { IPoint } from "../../interfaces/IPoint.js";
import { IDesignItem } from "../item/IDesignItem.js";
import { getElementSize } from "./getBoxQuads.js";

export interface IGridCellInformation {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  localX: number;
  localY: number;
}

export interface IGridGapInformation {
  x: number;
  y: number;
  width: number;
  height: number;
  localX: number;
  localY: number;
  column?: number;
  row?: number;
  type: 'h' | 'v';
}

export interface IGridInformation {
  cells: IGridCellInformation[][];
  gaps: IGridGapInformation[];
  xGap: number;
  yGap: number;
}

export interface IGridCellHitResult {
  row: number;
  column: number;
  cell: IGridCellInformation;
  localPoint: IPoint;
}

export function getElementGridInformation(element: HTMLElement) {
  let cs = getComputedStyle(element);
  let rowSpan = 1;
  let colSpan = 1;
  if (cs.gridRowEnd == 'auto')
    rowSpan = 1
  else if (cs.gridRowEnd.startsWith('span'))
    rowSpan = parseInt(cs.gridRowEnd.substring(4));
  else
    rowSpan = parseInt(cs.gridRowEnd) - parseInt(cs.gridRowStart);
  if (cs.gridColumnEnd == 'auto')
    colSpan = 1
  else if (cs.gridColumnEnd.startsWith('span'))
    colSpan = parseInt(cs.gridColumnEnd.substring(4));
  else
    colSpan = parseInt(cs.gridColumnEnd) - parseInt(cs.gridColumnStart);

  return { colSpan, rowSpan };
}

export function getGridLocalPoint(designItem: IDesignItem, point: IPoint): IPoint {
  const designerCanvas = designItem.instanceServiceContainer.designerCanvas;
  const localPoint = designItem.element.convertPointFromNode(new DOMPoint(point.x, point.y), designerCanvas.canvas, { iframes: designerCanvas.iframes });
  return { x: localPoint.x, y: localPoint.y };
}

export function getElementLocalToCanvasMatrix(designItem: IDesignItem): DOMMatrix {
  const designerCanvas = designItem.instanceServiceContainer.designerCanvas;
  const origin = designerCanvas.canvas.convertPointFromNode(new DOMPoint(0, 0), designItem.element, { iframes: designerCanvas.iframes });
  const xAxis = designerCanvas.canvas.convertPointFromNode(new DOMPoint(1, 0), designItem.element, { iframes: designerCanvas.iframes });
  const yAxis = designerCanvas.canvas.convertPointFromNode(new DOMPoint(0, 1), designItem.element, { iframes: designerCanvas.iframes });

  return new DOMMatrix([
    xAxis.x - origin.x,
    xAxis.y - origin.y,
    yAxis.x - origin.x,
    yAxis.y - origin.y,
    origin.x,
    origin.y,
  ]);
}

export function getGridColumnIndexFromLocalX(gridInformation: IGridInformation, localX: number): number {
  const columns = gridInformation.cells[0];
  if (!columns?.length || !Number.isFinite(localX))
    return 0;

  let column = 0;
  for (let i = 0; i < columns.length; i++) {
    const cell = columns[i];
    if (localX > cell.localX + cell.width / 2) {
      column = i;
    }
  }
  return column;
}

export function getGridRowIndexFromLocalY(gridInformation: IGridInformation, localY: number): number {
  if (!gridInformation.cells.length || !Number.isFinite(localY))
    return 0;

  let row = 0;
  for (let i = 0; i < gridInformation.cells.length; i++) {
    const cell = gridInformation.cells[i][0];
    if (localY > cell.localY + cell.height / 2) {
      row = i;
    }
  }
  return row;
}

export function getGridCellFromPoint(designItem: IDesignItem, point: IPoint, gridInformation: IGridInformation = calculateGridInformation(designItem)): IGridCellHitResult {
  const localPoint = getGridLocalPoint(designItem, point);
  if (!Number.isFinite(localPoint.x) || !Number.isFinite(localPoint.y))
    return null;

  for (let row = 0; row < gridInformation.cells.length; row++) {
    for (let column = 0; column < gridInformation.cells[row].length; column++) {
      const cell = gridInformation.cells[row][column];
      if (localPoint.x >= cell.localX && localPoint.x <= cell.localX + cell.width && localPoint.y >= cell.localY && localPoint.y <= cell.localY + cell.height) {
        return { row, column, cell, localPoint };
      }
    }
  }

  return null;
}

export function calculateGridInformation(designItem: IDesignItem): IGridInformation {

  //TODO: same name should combine columns/rows

  const designerCanvas = designItem.instanceServiceContainer.designerCanvas;
  const transformedCornerPoints: DOMQuad = designItem.element.getBoxQuads({ relativeTo: designerCanvas.canvas, iframes: designerCanvas.iframes })[0];
  const itemSize = getElementSize(designItem.element);

  const computedStyle = getComputedStyle(designItem.element);
  const rows = computedStyle.gridTemplateRows.split(' ');
  const columns = computedStyle.gridTemplateColumns.split(' ');

  const paddingLeft = Number.parseFloat(computedStyle.paddingLeft);
  const paddingTop = Number.parseFloat(computedStyle.paddingTop);
  const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth);
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth);


  let y = 0;
  let xGap = 0;
  let yGap = 0;
  let rw = 0;
  let xOffset = transformedCornerPoints.p1.x + borderLeft;
  let yOffset = transformedCornerPoints.p1.y + borderTop;
  let localXOffset = borderLeft;
  let localYOffset = borderTop;

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
    const diff = (itemSize.width - gesX) / 2;
    xOffset += diff;
    localXOffset += diff;
  } else if (computedStyle.justifyContent == 'end') {
    const diff = itemSize.width - gesX;
    xOffset += diff;
    localXOffset += diff;
  } else if (computedStyle.justifyContent == 'space-between') {
    xGap += (itemSize.width - gesX) / (columns.length - 1);
  } else if (computedStyle.justifyContent == 'space-around') {
    let gp = (itemSize.width - gesX) / (columns.length * 2);
    xGap += gp * 2;
    xOffset += gp;
    localXOffset += gp;
  } else if (computedStyle.justifyContent == 'space-evenly') {
    let gp = (itemSize.width - gesX) / (columns.length + 1);
    xGap += gp;
    xOffset += gp;
    localXOffset += gp;
  }

  if (computedStyle.alignContent == 'center') {
    const diff = (itemSize.height - gesY) / 2;
    yOffset += diff;
    localYOffset += diff;
  } else if (computedStyle.alignContent == 'end') {
    const diff = itemSize.height - gesY;
    yOffset += diff;
    localYOffset += diff;
  } else if (computedStyle.alignContent == 'space-between') {
    yGap += (itemSize.height - gesY) / (rows.length - 1);
  } else if (computedStyle.alignContent == 'space-around') {
    let gp = (itemSize.height - gesY) / (rows.length * 2);
    yGap += gp * 2;
    yOffset += gp;
    localYOffset += gp;
  } else if (computedStyle.alignContent == 'space-evenly') {
    let gp = (itemSize.height - gesY) / (rows.length + 1);
    yGap += gp;
    yOffset += gp;
    localYOffset += gp;
  }

  const retVal: IGridInformation = { cells: [], gaps: [], xGap, yGap };

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    let areas: string[] = null;
    if (gridA && gridA[rw + 1]) {
      areas = gridA[rw + 1].split(' ');
    }
    let x = 0;
    let cl = 0;
    const currY = Number.parseFloat(r.replace('px', ''));
    let cellList: IGridCellInformation[] = [];
    retVal.cells.push(cellList);
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const c = columns[colIdx];
      if (colIdx > 0) {
        retVal.gaps.push({ x: x + xOffset + paddingLeft, y: y + yOffset + paddingTop, width: xGap, height: currY, localX: x + localXOffset + paddingLeft, localY: y + localYOffset + paddingTop, column: colIdx, row: rowIdx, type: 'v' });
        x += xGap
      }
      const currX = Number.parseFloat(c.replace('px', ''));
      if (rowIdx > 0) {
        retVal.gaps.push({ x: x + xOffset + paddingLeft, y: y + yOffset - yGap + paddingTop, width: currX, height: yGap, localX: x + localXOffset + paddingLeft, localY: y + localYOffset - yGap + paddingTop, column: colIdx, row: rowIdx, type: 'h' });
      }
      let name = null;
      if (areas && areas[cl]) {
        const nm = areas[cl].trim();
        if (nm != '.') {
          name = nm;
        }
      }
      const cell = { x: x + xOffset + paddingLeft, y: y + yOffset + paddingTop, width: currX, height: currY, name: name, localX: x + localXOffset + paddingLeft, localY: y + localYOffset + paddingTop };
      cellList.push(cell);
      x += currX;
      cl++;
    }
    y += currY + yGap;
    rw += 2;
  }

  return retVal;
}