import { IDesignItem } from "../../item/IDesignItem.js";
import { Screenshot } from "../../helper/Screenshot.js";
import { requestAnimationFramePromise, sleep } from "../../helper/Helper.js";
import { IPngCreatorService } from "./IPngCreatorService.js";
import { DesignerCanvas } from "../../widgets/designerView/designerCanvas.js";

export class DisplayMediaPngWriterService implements IPngCreatorService {
    async takePng(designItems: IDesignItem[], margin: number): Promise<Uint8Array> {
        if (!designItems || designItems.length === 0) {
            return null;
        }

        const designerCanvas = designItems[0].instanceServiceContainer.designerCanvas;
        const selectionService = designItems[0].instanceServiceContainer.selectionService;
        const oldZoomFactor = designerCanvas.zoomFactor;
        const oldPos = designerCanvas.canvasOffset;
        const oldSelected = selectionService.selectedElements;

        try {
            await Screenshot.enableScreenshots();

            (<DesignerCanvas>designerCanvas).disableBackgroud();
            designerCanvas.zoomFactor = 1;
            selectionService.setSelectedElements([]);
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

            // Use the outer viewport element for screenshots so that the crop
            // coordinates are not affected by the canvasOffset CSS transform
            const viewportElement = (<DesignerCanvas>designerCanvas).outercanvas2;

            let sleepTime = 1000;

            for (let iy = 0; iy < numTilesY; iy++) {
                for (let ix = 0; ix < numTilesX; ix++) {
                    const tileX = minX + ix * effectiveW;
                    const tileY = minY + iy * effectiveH;

                    // Shift by borderInset so the 1px border falls outside the effective region
                    designerCanvas.canvasOffset = { x: -(tileX - borderInset), y: -(tileY - borderInset) };
                    // Wait for CSS transform to apply and video stream to capture the updated frame
                    await sleep(sleepTime);
                    sleepTime = 300;

                    const dataUrl = await Screenshot.takeScreenshot(
                        viewportElement,
                        captureW,
                        captureH
                    );

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
            selectionService.setSelectedElements(oldSelected);
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