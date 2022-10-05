import { EventNames } from "../../../../../enums/EventNames";
import { IPoint } from "../../../../../interfaces/IPoint";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { AbstractExtension } from "../AbstractExtension";
import { IExtensionManager } from "../IExtensionManger";


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


    override refresh() {
        this._removeAllOverlays();
        this.extend();
    }


    override dispose() {
        this._removeAllOverlays();
    }
}