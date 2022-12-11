import { EventNames } from '../../../../../enums/EventNames.js';
import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { IRect } from '../../../../../interfaces/IRect.js';


export class LineExtension extends AbstractExtension {
    private _parentRect: DOMRect;
    private _lineElement: SVGLineElement;
    private _circlePos: IPoint;
    private _startPos: IPoint;
    private _lastPos: IPoint;
    private _originalPoint: IPoint;
    private _newLinePoint: IPoint;
    private _newCirclePoint: IPoint;
    private _parentCoordinates: IRect;
    private _offsetSvg = 10.0;


    constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerView, extendedItem);
    }


    override extend() {
        this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
        this._lineElement = (<SVGLineElement>this.extendedItem.node);

        const x1 = this._lineElement.x1.baseVal.value;
        const y1 = this._lineElement.y1.baseVal.value;
        const x2 = this._lineElement.x2.baseVal.value;
        const y2 = this._lineElement.y2.baseVal.value;

        this._drawPathCircle(x1, y1, this._lineElement, 1);
        this._drawPathCircle(x2, y2, this._lineElement, 2);
    }


    pointerEvent(event: PointerEvent, circle: SVGCircleElement, l: SVGLineElement, index: number) {
        event.stopPropagation();
        const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

        switch (event.type) {
            case EventNames.PointerDown:
                (<Element>event.target).setPointerCapture(event.pointerId);
                this._startPos = cursorPos;
                this._circlePos = { x: parseFloat(circle.getAttribute("cx")), y: parseFloat(circle.getAttribute("cy")) }
                this._originalPoint = { x: parseFloat(l.getAttribute("x" + index)), y: parseFloat(l.getAttribute("y" + index)) };
                this._parentCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._lineElement.parentElement);
                break;

            case EventNames.PointerMove:
                if (this._startPos && event.buttons > 0) {

                    this._lastPos = { x: this._startPos.x, y: this._startPos.y };
                    const cx = cursorPos.x - this._lastPos.x + this._circlePos.x;
                    const cy = cursorPos.y - this._lastPos.y + this._circlePos.y;
                    const dx = cx - this._circlePos.x;
                    const dy = cy - this._circlePos.y;
                    if (event.shiftKey) {
                        if (Math.abs(dx) >= Math.abs(dy)) {
                            this._newCirclePoint = { x: this._circlePos.x + dx, y: this._circlePos.y }
                            this._newLinePoint = { x: this._originalPoint.x + dx, y: this._originalPoint.y }
                        }
                        else {
                            this._newCirclePoint = { x: this._circlePos.x, y: this._circlePos.y + dy }
                            this._newLinePoint = { x: this._originalPoint.x, y: this._originalPoint.y + dy }
                        }
                    } else {
                        this._newCirclePoint = { x: this._circlePos.x + dx, y: this._circlePos.y + dy }
                        this._newLinePoint = { x: this._originalPoint.x + dx, y: this._originalPoint.y + dy }
                    }
                    this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);

                    circle.setAttribute("cx", this._newCirclePoint.x.toString());
                    circle.setAttribute("cy", this._newCirclePoint.y.toString());
                    l.setAttribute("x" + index, this._newLinePoint.x.toString());
                    l.setAttribute("y" + index, this._newLinePoint.y.toString());
                }
                break;

            case EventNames.PointerUp:
                (<Element>event.target).releasePointerCapture(event.pointerId);

                this._startPos = null;
                this._circlePos = null;
                this._lastPos = null;
                this._originalPoint = null;
                this.extendedItem.setAttribute('x' + index, this._newLinePoint.x.toString());
                this.extendedItem.setAttribute('y' + index, this._newLinePoint.y.toString());

                if (getComputedStyle(this._lineElement.parentElement).position == "absolute") {
                    let group = this.extendedItem.openGroup('rearrangeSvg');
                    let newLineCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._lineElement);
                    let newLineCoordinatesCloud = this._getPointsFromRect(newLineCoordinates);
                    let newLineExtrema = this._getMinMaxValues(newLineCoordinatesCloud);
                    this._rearrangeSvgParent(newLineExtrema);
                    this._rearrangePointsFromElement(this._parentCoordinates);
                    group.commit();
                }
                break;
        }
    }

    _drawPathCircle(x: number, y: number, l: SVGLineElement, index: number) {
        let circle = this._drawCircle((this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y, 5 / this.designerCanvas.scaleFactor, 'svg-path');
        circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
        circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, circle, l, index));
        circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, circle, l, index));
        circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, circle, l, index));
    }

    _getPointsFromRect(elementCoords: IRect) {
        let Coords: number[] = [];
        Coords.push(elementCoords.x);
        Coords.push(elementCoords.x + elementCoords.width);
        Coords.push(elementCoords.y);
        Coords.push(elementCoords.y + elementCoords.height);
        Coords.push(elementCoords.height);
        Coords.push(elementCoords.width);
        return Coords;
    }

    _getMinMaxValues(coords) {
        let extrema = { xMin: 0.0, xMax: 0.0, yMin: 0.0, yMax: 0.0 };
        for (let i = 0; i < coords.length - 2; i++) {
            if (coords[i] < coords[i + 1] && i <= 1) {
                extrema.xMin = coords[i];
            } else if (coords[i] < coords[i + 1] && i > 1 && i <= 3) {
                extrema.yMin = coords[i];
            }
            if (coords[i] > coords[i + 1] && i <= 1) {
                extrema.xMax = coords[i];
            } else if (coords[i] > coords[i + 1] && i > 1 && i <= 3) {
                extrema.yMax = coords[i];
            }
        }
        return extrema;
    }

    _rearrangeSvgParent(newLineExtrema) {
        let parentLeft = newLineExtrema.xMin - this._offsetSvg;
        let parentTop = newLineExtrema.yMin - this._offsetSvg;
        let widthLineElement = newLineExtrema.xMax - newLineExtrema.xMin + (2 * this._offsetSvg);
        let heightLineElement = newLineExtrema.yMax - newLineExtrema.yMin + (2 * this._offsetSvg);
        this.extendedItem.parent.setStyle("left", parentLeft.toString() + "px");
        this.extendedItem.parent.setStyle("top", parentTop.toString() + "px");
        this.extendedItem.parent.setStyle("height", heightLineElement.toString() + "px");
        this.extendedItem.parent.setStyle("width", widthLineElement.toString() + "px");
    }

    _rearrangePointsFromElement(oldParentCoords: IRect) {
        let newParentCoords = this.designerCanvas.getNormalizedElementCoordinates(this._lineElement.parentElement);
        let diffX = oldParentCoords.x - newParentCoords.x;
        let diffY = oldParentCoords.y - newParentCoords.y;
        this.extendedItem.setAttribute('x1', (this._lineElement.x1.baseVal.value + diffX).toString());
        this.extendedItem.setAttribute('y1', (this._lineElement.y1.baseVal.value + diffY).toString());
        this.extendedItem.setAttribute('x2', (this._lineElement.x2.baseVal.value + diffX).toString());
        this.extendedItem.setAttribute('y2', (this._lineElement.y2.baseVal.value + diffY).toString());
    }

    override refresh() {
        this._removeAllOverlays();
        this.extend();
    }


    override dispose() {
        this._removeAllOverlays();
    }
}