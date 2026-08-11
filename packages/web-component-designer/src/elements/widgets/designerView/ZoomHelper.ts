import type { IPoint } from '../../../interfaces/IPoint.js';

export function getCanvasPointAtViewportCenter(viewportWidth: number, viewportHeight: number, zoomFactor: number, canvasOffset: IPoint): IPoint {
  return {
    x: viewportWidth / zoomFactor / 2 - canvasOffset.x,
    y: viewportHeight / zoomFactor / 2 - canvasOffset.y
  };
}

export class ZoomHoldRepeater {
  private _repeatTimeout: ReturnType<typeof setTimeout>;
  private _repeatInterval: ReturnType<typeof setInterval>;

  constructor(private _repeatDelay = 350, private _repeatRate = 100 / 6) {
  }

  start(initialAction: () => void, repeatAction: () => void = initialAction) {
    this.stop();
    initialAction();
    this._repeatTimeout = setTimeout(() => {
      repeatAction();
      this._repeatInterval = setInterval(repeatAction, this._repeatRate);
    }, this._repeatDelay);
  }

  stop() {
    if (this._repeatTimeout != null) {
      clearTimeout(this._repeatTimeout);
      this._repeatTimeout = null;
    }
    if (this._repeatInterval != null) {
      clearInterval(this._repeatInterval);
      this._repeatInterval = null;
    }
  }
}
