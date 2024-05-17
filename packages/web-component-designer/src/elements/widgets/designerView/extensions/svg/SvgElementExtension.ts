import { EventNames } from '../../../../../enums/EventNames.js';
import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from '../OverlayLayer.js';

function getSvgElementPoints(element: SVGElement): IPoint[] {
    if (element instanceof SVGRectElement) {
        return [
            { x: element.x.baseVal.value, y: element.y.baseVal.value },
            { x: element.x.baseVal.value + element.width.baseVal.value, y: element.y.baseVal.value },
            { x: element.x.baseVal.value + element.width.baseVal.value, y: element.y.baseVal.value + element.height.baseVal.value },
            { x: element.x.baseVal.value, y: element.y.baseVal.value + element.height.baseVal.value },
        ]
    } else if (element instanceof SVGLineElement) {
        return [
            { x: element.x1.baseVal.value, y: element.y1.baseVal.value },
            { x: element.x2.baseVal.value, y: element.y2.baseVal.value }
        ]
    }

    return null;
}

type SvgPoint = { type?: 'none' } & IPoint;

export class SvgElementExtension extends AbstractExtension {
    constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerView, extendedItem);
    }

    private _parentRect: DOMRect;
    private _svgElement: SVGElement;
    //private _startScrollOffset: IPoint;
    private _circles: SVGCircleElement[] = [];
    private _points: SvgPoint[];
    private _startPoint: SvgPoint;

    private _startPos: IPoint;

    override extend() {
        this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
        this._svgElement = (<SVGElement>this.extendedItem.node);
        //this._startScrollOffset = this.designerCanvas.canvasOffset;

        this.refresh();
    }

    override refresh() {
        let points = getSvgElementPoints(this._svgElement);
        if (points && this._valuesHaveChanges(this.designerCanvas.scaleFactor, ...points.map(x => x.x), ...points.map(x => x.y))) {
            this._points = points;
            for (let i = 0; i < this._points.length; i++) {
                this._circles[i] = this._drawPathCircle(i, this._circles[i]);
            }
        }
    }

    override dispose() {
        this._removeAllOverlays();
    }

    _drawPathCircle(index: number, circle: SVGCircleElement) {
        let newCircle = this._drawCircle(
            (this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + this._points[index].x,
            (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + this._points[index].y,
            5 / this.designerCanvas.scaleFactor,
            'svg-path', circle, OverlayLayer.Foreground);
        newCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

        if (!circle) {
            newCircle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, index, newCircle));
            newCircle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, index, newCircle));
            newCircle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, index, newCircle));
        }
        return newCircle;
    }

    pointerEvent(event: PointerEvent, index: number, circle: SVGCircleElement, changed?: ({ }) => void) {
        event.stopPropagation();
        event.preventDefault();
        const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

        const point = this._points[index];
        switch (event.type) {
            case EventNames.PointerDown:
                (<Element>event.target).setPointerCapture(event.pointerId);
                this._startPos = cursorPos;
                this._startPoint = { ...point };
                break;

            case EventNames.PointerMove:
                if (this._startPos && event.buttons > 0) {
                    let diffX = this._startPos.x - cursorPos.x;
                    let diffY = this._startPos.y - cursorPos.y;

                    if (event.shiftKey) {
                        if (Math.abs(diffX) < Math.abs(diffY)) {
                            diffX = 0;
                        } else {
                            diffY = 0;
                        }
                    }

                    point.x = this._startPoint.x - diffX;
                    point.y = this._startPoint.y - diffY;

                    this.modifyElementPoint(this._svgElement, index, point);

                    this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);
                }

                break;

            case EventNames.PointerUp:
                (<Element>event.target).releasePointerCapture(event.pointerId);
                this._startPos = null;

                /*if (getComputedStyle(this._rectElement.parentElement).position == "absolute") {
                    let group = this.extendedItem.openGroup('rearrangeSvg');
                    let newRectCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._rectElement);
                    let newRectCoordinatesCloud = this._getPointsFromRect(newRectCoordinates);
                    let newRectExtrema = this._getMinMaxValues(newRectCoordinatesCloud);
                    this._rearrangeSvgParent(newRectExtrema);
                    this._rearrangePointsFromElement(this._parentCoordinates);
                    group.commit();
                }*/
                break;
        }
    }

    modifyElementPoint(element: SVGElement, index: number, newPoint: IPoint) {
        if (element instanceof SVGRectElement) {
            if (index == 1) {
                this._points[0].y = newPoint.y;
                this._points[2].x = newPoint.x;
            } else if (index == 3) {
                this._points[2].y = newPoint.y;
                this._points[0].x = newPoint.x;
            }
            element.x.baseVal.value = this._points[0].x;
            element.y.baseVal.value = this._points[0].y;
            element.width.baseVal.value = this._points[2].x - this._points[0].x;
            element.height.baseVal.value = this._points[2].y - this._points[0].y;
        } else if (element instanceof SVGLineElement) {
            element.x1.baseVal.value = this._points[0].x;
            element.y1.baseVal.value = this._points[0].y;
            element.x2.baseVal.value = this._points[1].x;
            element.y2.baseVal.value = this._points[1].y;
        }
    }

    _getMinMaxValues(coords) {
        let extrema = { xMin: 0.0, xMax: 0.0, yMin: 0.0, yMax: 0.0 };
        for (let i = 0; i < coords.length - 2; i++) {
            if (coords[i] < coords[i + 1] && i <= 3) {
                extrema.xMin = coords[i];
            } else if (coords[i] < coords[i + 1] && i > 3 && i <= 7) {
                extrema.yMin = coords[i];
            }
            if (coords[i] > coords[i + 1] && i <= 3) {
                extrema.xMax = coords[i];
            } else if (coords[i] > coords[i + 1] && i > 3 && i <= 8) {
                extrema.yMax = coords[i];
            }
        }
        return extrema;
    }

    /*_rearrangeSvgParent(newRectExtrema) {
        let parentLeft = newRectExtrema.xMin - this._offsetSvg;
        let parentTop = newRectExtrema.yMin - this._offsetSvg;
        let widthRectElement = newRectExtrema.xMax - newRectExtrema.xMin + (2 * this._offsetSvg);
        let heightRectElement = newRectExtrema.yMax - newRectExtrema.yMin + (2 * this._offsetSvg);
        this.extendedItem.parent.setStyle("left", parentLeft.toString() + "px");
        this.extendedItem.parent.setStyle("top", parentTop.toString() + "px");
        this.extendedItem.parent.setStyle("height", Math.round(heightRectElement).toString() + "px");
        this.extendedItem.parent.setStyle("width", Math.round(widthRectElement).toString() + "px");
    }*/

    /*_rearrangePointsFromElement(oldParentCoords: IRect) {
        let newParentCoords = this.designerCanvas.getNormalizedElementCoordinates(this._rectElement.parentElement);
        let diffX = oldParentCoords.x - newParentCoords.x;
        let diffY = oldParentCoords.y - newParentCoords.y;
        this.extendedItem.setAttribute('x', (this._rectElement.x.baseVal.value + diffX).toString());
        this.extendedItem.setAttribute('y', (this._rectElement.y.baseVal.value + diffY).toString());
    }*/
}