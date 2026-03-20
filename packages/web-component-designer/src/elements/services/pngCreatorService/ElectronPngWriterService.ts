import { IDesignItem } from "../../item/IDesignItem.js";
import { requestAnimationFramePromise, sleep } from "../../helper/Helper.js";
import { IPngCreatorService } from "./IPngCreatorService.js";
import { DesignerCanvas } from "../../widgets/designerView/designerCanvas.js";

/**
 * PNG writer service for Electron that uses BrowserWindow.capturePage()
 * instead of getDisplayMedia(). No recording rect is shown and no user
 * permission prompt is needed.
 *
 * The constructor accepts a capturePageFn callback that should invoke
 * BrowserWindow.capturePage() (via IPC from the renderer) and return
 * a data-URL of the captured image.
 *
 * Example usage from an Electron renderer process:
 *
 *   const { ipcRenderer } = require('electron');
 *
 *   const capturePageFn = async (rect) => {
 *     // main process calls: mainWindow.webContents.capturePage(rect)
 *     return await ipcRenderer.invoke('capture-page', rect);
 *   };
 *
 *   serviceContainer.register('pngCreatorService',
 *     new ElectronPngWriterService(capturePageFn));
 */
export class ElectronPngWriterService implements IPngCreatorService {
    private _capturePageFn: (rect: { x: number, y: number, width: number, height: number }) => Promise<string>;

    /**
     * @param capturePageFn  A function that captures a portion of the current
     *   BrowserWindow and returns a data-URL (e.g. "data:image/png;base64,…").
     *   The rect is in CSS pixels relative to the page (matching Electron's
     *   capturePage rectangle).
     */
    constructor(capturePageFn: (rect: { x: number, y: number, width: number, height: number }) => Promise<string>) {
        this._capturePageFn = capturePageFn;
    }

    async takePng(designItems: IDesignItem[], options?: { margin?: number, removeSelection?: boolean }): Promise<Uint8Array> {
        if (!designItems || designItems.length === 0) {
            return null;
        }

        const designerCanvas = designItems[0].instanceServiceContainer.designerCanvas;
        const selectionService = designItems[0].instanceServiceContainer.selectionService;
        const oldZoomFactor = designerCanvas.zoomFactor;
        const oldPos = designerCanvas.canvasOffset;
        const oldSelected = selectionService.selectedElements;

        try {
            (<DesignerCanvas>designerCanvas).disableBackgroud();
            designerCanvas.zoomFactor = 1;
            if (options?.removeSelection) {
                selectionService.setSelectedElements([]);
            }
            designerCanvas.canvasOffset = { x: 0, y: 0 };
            await requestAnimationFramePromise();

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const item of designItems) {
                const rect = designerCanvas.getNormalizedElementCoordinates(item.element);
                minX = Math.min(minX, rect.x);
                minY = Math.min(minY, rect.y);
                maxX = Math.max(maxX, rect.x + rect.width);
                maxY = Math.max(maxY, rect.y + rect.height);
            }

            const margin = options?.margin ?? 0;
            minX -= margin;
            minY -= margin;
            maxX += margin;
            maxY += margin;

            const totalWidth = Math.ceil(maxX - minX);
            const totalHeight = Math.ceil(maxY - minY);

            const viewportW = designerCanvas.canvas.offsetWidth;
            const viewportH = designerCanvas.canvas.offsetHeight;

            // Inset by 1 CSS pixel on each edge to avoid border artifacts when stitching tiles
            const borderInset = 1;
            const effectiveW = viewportW - 2 * borderInset;
            const effectiveH = viewportH - 2 * borderInset;

            const numTilesX = Math.ceil(totalWidth / effectiveW);
            const numTilesY = Math.ceil(totalHeight / effectiveH);

            const dpr = window.devicePixelRatio || 1;
            const captureW = Math.ceil(viewportW * dpr);
            const captureH = Math.ceil(viewportH * dpr);
            const insetPx = Math.ceil(borderInset * dpr);
            const effectiveCaptureW = captureW - 2 * insetPx;
            const effectiveCaptureH = captureH - 2 * insetPx;

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = Math.ceil(totalWidth * dpr);
            finalCanvas.height = Math.ceil(totalHeight * dpr);
            const finalCtx = finalCanvas.getContext('2d');

            // Use the outer viewport element to determine the capture rectangle
            // so that coordinates are not affected by the canvasOffset CSS transform
            const viewportElement = (<DesignerCanvas>designerCanvas).outercanvas2;

            for (let iy = 0; iy < numTilesY; iy++) {
                for (let ix = 0; ix < numTilesX; ix++) {
                    const tileX = minX + ix * effectiveW;
                    const tileY = minY + iy * effectiveH;

                    // Shift by borderInset so the 1px border falls outside the effective region
                    designerCanvas.canvasOffset = { x: -(tileX - borderInset), y: -(tileY - borderInset) };
                    // Wait for CSS transform to apply and the renderer to paint the new frame
                    await requestAnimationFramePromise();
                    await sleep(100);

                    const vpRect = viewportElement.getBoundingClientRect();
                    const dataUrl = await this._capturePageFn({
                        x: Math.round(vpRect.left),
                        y: Math.round(vpRect.top),
                        width: Math.round(vpRect.width),
                        height: Math.round(vpRect.height)
                    });

                    const img = await this._loadImage(dataUrl);
                    // Draw only the inner region, skipping the 1px border on all sides
                    finalCtx.drawImage(
                        img,
                        insetPx, insetPx, effectiveCaptureW, effectiveCaptureH,
                        ix * effectiveCaptureW, iy * effectiveCaptureH, effectiveCaptureW, effectiveCaptureH
                    );
                }
            }

            const blob = await new Promise<Blob>(resolve => finalCanvas.toBlob(resolve, 'image/png'));
            const arrayBuffer = await blob.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        } finally {
            designerCanvas.zoomFactor = oldZoomFactor;
            designerCanvas.canvasOffset = oldPos;
            (<DesignerCanvas>designerCanvas).enableBackground();
            if (options?.removeSelection) {
                selectionService.setSelectedElements(oldSelected);
            }
        }
    }

    private _loadImage(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
}
