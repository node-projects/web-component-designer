const panThreshold = 10;
const zoomThreshold = 10;
//const rotateThreshold = 0;

export class TouchGestureHelper {
    public static addTouchEvents(element: HTMLElement) {
        return new TouchGestureHelper(element);
    }

    private constructor(element: HTMLElement) {
        this._target = element;

        element.addEventListener('touchstart', (e) => this._touchStart(e));
        element.addEventListener('touchmove', (e) => this._touchMove(e));
        element.addEventListener('touchend', (e) => this._touchEnd(e));
        element.addEventListener('touchcancel', (e) => this._touchEnd(e));
    }

    private _target: HTMLElement;

    private _started: boolean;

    private _startX_0: number;
    private _startY_0: number;
    //private _startX_1: number;
    //private _startY_1: number;
    private _lastZoom: number;
    private _lastPanDistanceX: number;
    private _lastPanDistanceY: number;

    private _startZoomDistance: number;

    public multitouchEventActive: boolean;


    private _mode: 'pan' | 'zoom' | 'rotate' = null;

    _touchStart(e: TouchEvent) {

        if (e.touches.length === 2) {
            this.multitouchEventActive = true;

            this._mode = null;

            this._started = true;
            this._startX_0 = e.touches[0].screenX;
            this._startY_0 = e.touches[0].screenY;
            //this._startX_1 = e.touches[1].screenX;
            //this._startY_1 = e.touches[1].screenY;

            this._lastZoom = 0;
            this._lastPanDistanceX = 0;
            this._lastPanDistanceY = 0;

            this._startZoomDistance = Math.hypot(
                e.touches[0].screenX - e.touches[1].screenX,
                e.touches[0].screenY - e.touches[1].screenY);
        } else {
            this.multitouchEventActive = false;
            this._started = false;
        }
    }

    _touchMove(e: TouchEvent) {
        if (e.touches.length !== 2) {
            this.multitouchEventActive = false;
            this._started = false;
        }
        if (this._started) {
            e.preventDefault();

            let newZoomDistance = Math.hypot(
                e.touches[0].screenX - e.touches[1].screenX,
                e.touches[0].screenY - e.touches[1].screenY);

            const newPanDistanceX = this._startX_0 - e.touches[0].screenX;
            const newPanDistanceY = this._startY_0 - e.touches[0].screenY;
            const panDiffX = newPanDistanceX - this._lastPanDistanceX;
            const panDiffY = newPanDistanceY - this._lastPanDistanceY;
            this._lastPanDistanceX = newPanDistanceX;
            this._lastPanDistanceY = newPanDistanceY;

            const zoom = newZoomDistance - this._startZoomDistance;
            const zoomDiff = zoom - this._lastZoom;
            this._lastZoom = zoom;

            this._lastZoom
            if (!this._mode) {
                if (Math.abs(zoom) > zoomThreshold) {
                    this._mode = 'zoom'
                }
                if (Math.abs(newPanDistanceX) > panThreshold || Math.abs(newPanDistanceY) > panThreshold) {
                    this._mode = 'pan'
                }
            }

            if (this._mode) {
                if (this._mode == 'zoom') {
                    const event = new CustomEvent("zoom", { detail: { factor: zoom, diff: zoomDiff } });
                    this._target.dispatchEvent(event);
                } else if (this._mode == 'pan') {
                    const event = new CustomEvent("pan", { detail: { x: newPanDistanceX, deltaX: panDiffX, y: newPanDistanceY, deltaY: panDiffY } });
                    this._target.dispatchEvent(event);
                }
            }
        }
    }

    _touchEnd(e: TouchEvent) {
        this.multitouchEventActive = false;
        if (e.touches.length !== 2) {

        }
    }

}
