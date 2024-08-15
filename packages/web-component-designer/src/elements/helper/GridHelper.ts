import { IDesignItem } from "../item/IDesignItem.js";
import { DesignerCanvas } from "../widgets/designerView/designerCanvas.js";

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

export function calculateGridInformation(designItem: IDesignItem) {

  //TODO: same name should combine columns/rows

  let itemRect = designItem.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(designItem.element);
  let transformedCornerPoints: DOMQuad = designItem.element.getBoxQuads({ relativeTo: <DesignerCanvas>designItem.instanceServiceContainer.designerCanvas.canvas })[0];

  const computedStyle = getComputedStyle(designItem.element);
  const rows = computedStyle.gridTemplateRows.split(' ');
  const columns = computedStyle.gridTemplateColumns.split(' ');

  const paddingLeft = Number.parseFloat(computedStyle.paddingLeft);
  const paddingTop = Number.parseFloat(computedStyle.paddingTop);


  let y = 0;
  let xGap = 0;
  let yGap = 0;
  let rw = 0;
  let xOffset = transformedCornerPoints.p1.x;
  let yOffset = transformedCornerPoints.p1.y;
  xOffset += parseFloat(computedStyle.borderLeftWidth);
  yOffset += parseFloat(computedStyle.borderTopWidth);

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

  const retVal: {
    cells?: { x: number, y: number, width: number, height: number, name: string }[][],
    gaps?: { x: number, y: number, width: number, height: number, column?: number, row?: number, type: 'h' | 'v' }[],
    xGap: number
    yGap: number
  } = { cells: [], gaps: [], xGap, yGap };

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    let areas: string[] = null;
    if (gridA && gridA[rw + 1]) {
      areas = gridA[rw + 1].split(' ');
    }
    let x = 0;
    let cl = 0;
    const currY = Number.parseFloat(r.replace('px', ''));
    let cellList: { x: number, y: number, width: number, height: number, name: string }[] = [];
    retVal.cells.push(cellList);
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const c = columns[colIdx];
      if (colIdx > 0) {
        retVal.gaps.push({ x: x + xOffset + paddingLeft, y: y + yOffset + paddingTop, width: xGap, height: currY, column: colIdx, row: rowIdx, type: 'v' });
        x += xGap
      }
      const currX = Number.parseFloat(c.replace('px', ''));
      if (rowIdx > 0) {
        retVal.gaps.push({ x: x + xOffset + paddingLeft, y: y + yOffset - yGap + paddingTop, width: currX, height: yGap, column: colIdx, row: rowIdx, type: 'h' });
      }
      let name = null;
      if (areas && areas[cl]) {
        const nm = areas[cl].trim();
        if (nm != '.') {
          name = nm;
        }
      }
      const cell = { x: x + xOffset + paddingLeft, y: y + yOffset + paddingTop, width: currX, height: currY, name: name };
      cellList.push(cell);
      x += currX;
      cl++;
    }
    y += currY + yGap;
    rw += 2;
  }

  return retVal;
}