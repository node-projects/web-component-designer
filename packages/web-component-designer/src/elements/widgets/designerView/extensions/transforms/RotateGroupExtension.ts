import { IPoint } from '../../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../../helper/KeyboardHelper.js';
import { filterChildPlaceItems, roundValue } from '../../../../helper/LayoutHelper.js';
import { calculateOuterRect } from '../../../../helper/ElementHelper.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';

interface ElementStartState {
  item: IDesignItem;
  rotation: number;
  centerX: number;
  centerY: number;
  cssHalfWidth: number;   // half of CSS width (not visual bounding box — matters for pre-rotated elements)
  cssHalfHeight: number;
  parentX: number;
  parentY: number;
  parentWidth: number;
  parentHeight: number;
  usesRight: boolean;
  usesBottom: boolean;
}

export class RotateGroupExtension extends AbstractExtension {

  private _rotateLine: SVGLineElement;
  private _rotateCircle: SVGCircleElement;

  // rotating rect overlay (only visible during drag)
  private _rectLine1: SVGLineElement;
  private _rectLine2: SVGLineElement;
  private _rectLine3: SVGLineElement;
  private _rectLine4: SVGLineElement;
  private _initialCorners: IPoint[];

  // drag-start state
  private _startAngle: number;
  private _groupCenter: IPoint;
  private _initialHandleX: number;
  private _initialHandleY: number;
  private _initialLineX1: number;
  private _initialLineY1: number;
  private _initialLineX2: number;
  private _initialLineY2: number;
  private _currentDelta: number = 0;
  private _elementStartStates: ElementStartState[];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const selection = filterChildPlaceItems(
      this.designerCanvas.instanceServiceContainer.selectionService.selectedElements
    );
    if (selection.length < 2) return;

    let handleX: number, handleY: number;
    let lineX1: number, lineY1: number, lineX2: number, lineY2: number;

    if (this._elementStartStates) {
      // During drag: rotate all control points around the fixed group center
      const rad = this._currentDelta * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = (x: number, y: number) =>
        this._groupCenter.x + (x - this._groupCenter.x) * cos - (y - this._groupCenter.y) * sin;
      const ry = (x: number, y: number) =>
        this._groupCenter.y + (x - this._groupCenter.x) * sin + (y - this._groupCenter.y) * cos;

      handleX = rx(this._initialHandleX, this._initialHandleY);
      handleY = ry(this._initialHandleX, this._initialHandleY);
      lineX1 = rx(this._initialLineX1, this._initialLineY1);
      lineY1 = ry(this._initialLineX1, this._initialLineY1);
      lineX2 = rx(this._initialLineX2, this._initialLineY2);
      lineY2 = ry(this._initialLineX2, this._initialLineY2);

      // Rotate the four bounding-box corners and draw the rect overlay
      const c = this._initialCorners;
      const corners = c.map(p => ({ x: rx(p.x, p.y), y: ry(p.x, p.y) }));
      const sw = (2 / this.designerCanvas.zoomFactor).toString();
      this._rectLine1 = this._drawLine(corners[0].x, corners[0].y, corners[1].x, corners[1].y, 'svg-rotate-group-rect', this._rectLine1);
      this._rectLine2 = this._drawLine(corners[1].x, corners[1].y, corners[2].x, corners[2].y, 'svg-rotate-group-rect', this._rectLine2);
      this._rectLine3 = this._drawLine(corners[2].x, corners[2].y, corners[3].x, corners[3].y, 'svg-rotate-group-rect', this._rectLine3);
      this._rectLine4 = this._drawLine(corners[3].x, corners[3].y, corners[0].x, corners[0].y, 'svg-rotate-group-rect', this._rectLine4);
      this._rectLine1.style.strokeWidth = sw;
      this._rectLine2.style.strokeWidth = sw;
      this._rectLine3.style.strokeWidth = sw;
      this._rectLine4.style.strokeWidth = sw;
    } else {
      if (this._rectLine1) {
        this._rectLine1.style.display = 'none';
        this._rectLine2.style.display = 'none';
        this._rectLine3.style.display = 'none';
        this._rectLine4.style.display = 'none';
      }
      // Idle: position above the bounding box center
      const outerRect = calculateOuterRect(selection, this.designerCanvas);
      const cx = outerRect.x + outerRect.width / 2;
      const top = outerRect.y;

      handleX = cx;
      handleY = top - 30 / this.designerCanvas.zoomFactor;
      lineX1 = cx;
      lineY1 = top - 22 / this.designerCanvas.zoomFactor;
      lineX2 = cx;
      lineY2 = top - 6 / this.designerCanvas.zoomFactor;
    }

    this._rotateLine = this._drawLine(lineX1, lineY1, lineX2, lineY2, 'svg-primary-rotate-line', this._rotateLine);
    this._rotateLine.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

    if (!this._rotateCircle) {
      this._rotateCircle = this._drawCircle(handleX, handleY, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

      this._rotateCircle.addEventListener('pointerdown', e => {
        e.stopPropagation();
        (<Element>e.target).setPointerCapture(e.pointerId);

        const currentSelection = filterChildPlaceItems(
          this.designerCanvas.instanceServiceContainer.selectionService.selectedElements
        );
        const outerRect = calculateOuterRect(currentSelection, this.designerCanvas);
        const cx = outerRect.x + outerRect.width / 2;
        const top = outerRect.y;

        this._groupCenter = {
          x: cx,
          y: outerRect.y + outerRect.height / 2,
        };

        // Store control point positions as canvas coords so they can be rotated during drag
        this._initialHandleX = cx;
        this._initialHandleY = top - 30 / this.designerCanvas.zoomFactor;
        this._initialLineX1 = cx;
        this._initialLineY1 = top - 22 / this.designerCanvas.zoomFactor;
        this._initialLineX2 = cx;
        this._initialLineY2 = top - 6 / this.designerCanvas.zoomFactor;

        // Capture the four corners of the bounding rect for the rotating overlay
        this._initialCorners = [
          { x: outerRect.x, y: outerRect.y },
          { x: outerRect.x + outerRect.width, y: outerRect.y },
          { x: outerRect.x + outerRect.width, y: outerRect.y + outerRect.height },
          { x: outerRect.x, y: outerRect.y + outerRect.height },
        ];
        // Show rect lines if they were hidden from a previous drag
        if (this._rectLine1) {
          this._rectLine1.style.display = '';
          this._rectLine2.style.display = '';
          this._rectLine3.style.display = '';
          this._rectLine4.style.display = '';
        }

        const mp = this.designerCanvas.getNormalizedEventCoordinates(e);
        this._startAngle = Math.atan2(mp.y - this._groupCenter.y, mp.x - this._groupCenter.x);
        this._currentDelta = 0;

        this._elementStartStates = currentSelection.map(item => {
          const coords = this.designerCanvas.getNormalizedElementCoordinates(item.element);
          const parent = this.designerCanvas.getNormalizedElementCoordinates(item.parent.element);
          const rotateStr = item.getStyle('rotate') ?? '0deg';
          const rotation = parseFloat(rotateStr) || 0;
          // getBoundingClientRect returns the visual (rotated) bounding box. For position
          // calculations we need the actual CSS dimensions (unrotated box), otherwise
          // pre-rotated elements would be placed incorrectly.
          const cs = getComputedStyle(item.element);
          const cssHalfWidth = parseFloat(cs.width) / 2;
          const cssHalfHeight = parseFloat(cs.height) / 2;
          return {
            item,
            rotation,
            centerX: coords.x + coords.width / 2,
            centerY: coords.y + coords.height / 2,
            cssHalfWidth,
            cssHalfHeight,
            parentX: parent.x,
            parentY: parent.y,
            parentWidth: parent.width,
            parentHeight: parent.height,
            usesRight: item.hasStyle('right') && !item.hasStyle('left'),
            usesBottom: item.hasStyle('bottom') && !item.hasStyle('top'),
          };
        });
      });

      this._rotateCircle.addEventListener('pointermove', e => {
        e.stopPropagation();
        if (!this._elementStartStates) return;

        this._currentDelta = this._getDelta(e);
        for (const state of this._elementStartStates) {
          this._applyRotation(state, this._currentDelta, false);
        }
      });

      this._rotateCircle.addEventListener('pointerup', e => {
        e.stopPropagation();
        (<Element>e.target).releasePointerCapture(e.pointerId);
        if (!this._elementStartStates) return;

        const delta = this._getDelta(e);
        const grp = this.designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('rotateGroup');
        for (const state of this._elementStartStates) {
          this._applyRotation(state, delta, true);
        }
        grp.commit();

        this._elementStartStates = null;
        this._currentDelta = 0;
      });
    } else {
      this._rotateCircle = this._drawCircle(handleX, handleY, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    }
  }

  private _getDelta(e: MouseEvent): number {
    const mp = this.designerCanvas.getNormalizedEventCoordinates(e);
    const currentAngle = Math.atan2(mp.y - this._groupCenter.y, mp.x - this._groupCenter.x);
    let delta = (currentAngle - this._startAngle) * 180 / Math.PI;
    // Normalize to (-180, 180] to avoid jumps when crossing the ±180° boundary
    delta = ((delta + 180) % 360 + 360) % 360 - 180;
    if (!hasCommandKey(e))
      delta = Math.round(delta / 15) * 15;
    return delta;
  }

  private _applyRotation(state: ElementStartState, deltaAngle: number, commit: boolean) {
    const rad = deltaAngle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = state.centerX - this._groupCenter.x;
    const dy = state.centerY - this._groupCenter.y;
    const newCenterX = this._groupCenter.x + dx * cos - dy * sin;
    const newCenterY = this._groupCenter.y + dx * sin + dy * cos;

    const newRotation = roundValue(state.item, state.rotation + deltaAngle);

    const newLeft = newCenterX - state.cssHalfWidth - state.parentX;
    const newTop = newCenterY - state.cssHalfHeight - state.parentY;
    const newRight = state.parentX + state.parentWidth - newCenterX - state.cssHalfWidth;
    const newBottom = state.parentY + state.parentHeight - newCenterY - state.cssHalfHeight;

    if (commit) {
      if (state.usesRight)
        state.item.setStyle('right', newRight + 'px');
      else
        state.item.setStyle('left', newLeft + 'px');

      if (state.usesBottom)
        state.item.setStyle('bottom', newBottom + 'px');
      else
        state.item.setStyle('top', newTop + 'px');

      state.item.setStyle('rotate', newRotation + 'deg');
    } else {
      const el = <HTMLElement>state.item.element;
      if (state.usesRight)
        el.style.right = newRight + 'px';
      else
        el.style.left = newLeft + 'px';

      if (state.usesBottom)
        el.style.bottom = newBottom + 'px';
      else
        el.style.top = newTop + 'px';

      //@ts-ignore
      el.style.rotate = newRotation + 'deg';
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}
