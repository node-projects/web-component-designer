import { EventNames } from "../../../../../enums/EventNames";
import { IPoint } from "../../../../../interfaces/IPoint";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { AbstractExtension } from "../AbstractExtension";
import { IExtensionManager } from "../IExtensionManger";
import { IRect } from "../../../../../interfaces/IRect";


export class EllipsisExtension extends AbstractExtension {
    private _parentRect: DOMRect;
    private _ellipseElement: SVGEllipseElement;
    private _circlePos: IPoint;
    private _startPos: IPoint;
    private _lastPos: IPoint;
    private _originalPoint: IPoint;
    private _cx: number;
    private _cy: number;
    private _rx: number;
    private _ry: number;
    private _newRx: number;
    private _newRy: number;
    private _circle1: SVGCircleElement;
    private _circle2: SVGCircleElement;
    private _circle3: SVGCircleElement;
    private _circle4: SVGCircleElement;
    private _parentCoordinates: IRect;
    private _offsetSvg = 10.0;
    constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerView, extendedItem);
    }


    override extend() {
        this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
        this._ellipseElement = (<SVGEllipseElement>this.extendedItem.node);

        this._cx = this._ellipseElement.cx.baseVal.value;
        this._cy = this._ellipseElement.cy.baseVal.value;
        this._rx = this._ellipseElement.rx.baseVal.value;
        this._ry = this._ellipseElement.ry.baseVal.value;

        this._circle1 = this._drawPathCircle(this._cx, this._cy - this._ry, this._ellipseElement, 0)
        this._circle2 = this._drawPathCircle(this._cx + this._rx, this._cy, this._ellipseElement, 1)
        this._circle3 = this._drawPathCircle(this._cx, this._cy + this._ry, this._ellipseElement, 2)
        this._circle4 = this._drawPathCircle(this._cx - this._rx, this._cy, this._ellipseElement, 3)
    }


    pointerEvent(event: PointerEvent, circle: SVGCircleElement, e: SVGEllipseElement, index: number) {
        event.stopPropagation();
        const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

        switch (event.type) {
            case EventNames.PointerDown:
                (<Element>event.target).setPointerCapture(event.pointerId);
                this._startPos = cursorPos;
                this._circlePos = { x: parseFloat(circle.getAttribute("cx")), y: parseFloat(circle.getAttribute("cy")) }
                this._originalPoint = { x: this._rx, y: this._ry }
                this._parentCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._ellipseElement.parentElement);
                break;

            case EventNames.PointerMove:
                if (this._startPos && event.buttons > 0) {

                    this._lastPos = { x: this._startPos.x, y: this._startPos.y };
                    const cx = cursorPos.x - this._lastPos.x + this._circlePos.x;
                    const cy = cursorPos.y - this._lastPos.y + this._circlePos.y;
                    let dx = cx - this._circlePos.x;
                    let dy = cy - this._circlePos.y;
                    switch (index) {
                        case 0:
                            this._newRx = this._originalPoint.x;
                            this._newRy = Math.abs(this._originalPoint.y - dy);
                            circle.setAttribute("cy", (this._circlePos.y + dy).toString());
                            break;

                        case 1:
                            this._newRx = Math.abs(this._originalPoint.x + dx);
                            this._newRy = this._originalPoint.y;
                            circle.setAttribute("cx", (this._circlePos.x + dx).toString());
                            break;

                        case 2:
                            this._newRx = this._originalPoint.x;
                            this._newRy = Math.abs(this._originalPoint.y + dy);
                            circle.setAttribute("cy", (this._circlePos.y + dy).toString());
                            break;

                        case 3:
                            this._newRx = Math.abs(this._originalPoint.x - dx);
                            this._newRy = this._originalPoint.y;
                            circle.setAttribute("cx", (this._circlePos.x + dx).toString());
                            break;
                    }
                    e.setAttribute("rx", this._newRx.toString());
                    e.setAttribute("ry", this._newRy.toString());

                    this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);

                    this._redrawPathCircle(this._cx, this._cy - this._newRy, this._circle1);
                    this._redrawPathCircle(this._cx + this._newRx, this._cy, this._circle2);
                    this._redrawPathCircle(this._cx, this._cy + this._newRy, this._circle3);
                    this._redrawPathCircle(this._cx - this._newRx, this._cy, this._circle4);


                }
                break;


            case EventNames.PointerUp:
                (<Element>event.target).releasePointerCapture(event.pointerId);
                this._startPos = null;
                this._circlePos = null;
                this._originalPoint = null;
                this.extendedItem.setAttribute("rx", this._newRx.toString());
                this.extendedItem.setAttribute("ry", this._newRy.toString());
                if(getComputedStyle(this._ellipseElement.parentElement).position == "absolute"){
                    let group = this.extendedItem.openGroup('rearrangeSvg');
                    let newEllipseCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._ellipseElement);
                    let newEllipseCoordinatesCloud = this._getPointsFromEllipse(newEllipseCoordinates);
                    let newEllipseExtrema = this._getMinMaxValues(newEllipseCoordinatesCloud);
                    this._rearrangeSvgParent(newEllipseExtrema);
                    this._rearrangePointsFromElement(this._parentCoordinates);
                    group.commit();
                }
                break;
        }
    }



    _drawPathCircle(x: number, y: number, e: SVGEllipseElement, index: number) {
        let circle = this._drawCircle((this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y, 5 / this.designerCanvas.scaleFactor, 'svg-path');
        circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();


        circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, circle, e, index));
        circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, circle, e, index));
        circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, circle, e, index));
        return circle;
    }

    _redrawPathCircle(x: number, y: number, oldCircle: SVGCircleElement) {
        let circle = this._drawCircle((this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x, (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y, 5 / this.designerCanvas.scaleFactor, 'svg-path', oldCircle);
        circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
        return circle;

    }

    _getPointsFromEllipse(elementCoords: IRect) {
        let Coords: number[] = [];
        Coords.push(elementCoords.x);
        Coords.push(elementCoords.x + elementCoords.width);
        Coords.push(elementCoords.x);
        Coords.push(elementCoords.x + elementCoords.width);
        Coords.push(elementCoords.y);
        Coords.push(elementCoords.y);
        Coords.push(elementCoords.y + elementCoords.height);
        Coords.push(elementCoords.y + elementCoords.height);
        Coords.push(elementCoords.height);
        Coords.push(elementCoords.width);
        return Coords;
    }

    _getMinMaxValues(coords){
        let extrema = {xMin: 0.0, xMax: 0.0, yMin: 0.0, yMax: 0.0};
        for (let i = 0; i < coords.length - 2; i++) {
            if(coords[i] < coords[i+1] && i <= 3){
                extrema.xMin = coords[i];
            }else if(coords[i] < coords[i+1]&& i > 3 && i <= 7){
                extrema.yMin = coords[i];
            }
            if(coords[i] > coords[i+1]&& i <= 3){
                extrema.xMax = coords[i];
            }else if(coords[i] > coords[i+1] && i > 3 && i <= 8){
                extrema.yMax = coords[i];
            }
        }
        return extrema;
    }

    _rearrangeSvgParent(newEllipseExtrema){
        let parentLeft = newEllipseExtrema.xMin - this._offsetSvg;
        let parentTop = newEllipseExtrema.yMin - this._offsetSvg;
        let widthEllipseElement = newEllipseExtrema.xMax - newEllipseExtrema.xMin + (2 * this._offsetSvg);
        let heightEllipseElement = newEllipseExtrema.yMax - newEllipseExtrema.yMin + (2 * this._offsetSvg);
        this.extendedItem.parent.setStyle("left", parentLeft.toString() + "px");
        this.extendedItem.parent.setStyle("top", parentTop.toString() + "px");
        this.extendedItem.parent.setStyle("height", heightEllipseElement.toString() + "px");
        this.extendedItem.parent.setStyle("width", widthEllipseElement.toString() + "px");
    }

    _rearrangePointsFromElement(oldParentCoords: IRect){
        let newParentCoords = this.designerCanvas.getNormalizedElementCoordinates(this._ellipseElement.parentElement);
        let diffX = oldParentCoords.x - newParentCoords.x;
        let diffY = oldParentCoords.y - newParentCoords.y;
        this.extendedItem.setAttribute('cx', (this._ellipseElement.cx.baseVal.value + diffX).toString());
        this.extendedItem.setAttribute('cy', (this._ellipseElement.cy.baseVal.value + diffY).toString());
    }


    override refresh() {
        this._removeAllOverlays();
        this.extend();
    }


    override dispose() {
        this._removeAllOverlays();
    }
}