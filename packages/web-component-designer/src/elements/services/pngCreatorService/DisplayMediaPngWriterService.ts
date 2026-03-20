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

            const numTilesX = Math.ceil(totalWidth / viewportW);
            const numTilesY = Math.ceil(totalHeight / viewportH);

            const dpr = window.devicePixelRatio || 1;
            const captureW = Math.ceil(viewportW * dpr);
            const captureH = Math.ceil(viewportH * dpr);

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = Math.ceil(totalWidth * dpr);
            finalCanvas.height = Math.ceil(totalHeight * dpr);
            const finalCtx = finalCanvas.getContext('2d');

            await Screenshot.enableScreenshots();

            // Use the outer viewport element for screenshots so that the crop
            // coordinates are not affected by the canvasOffset CSS transform
            const viewportElement = (<DesignerCanvas>designerCanvas).outercanvas2;

            for (let iy = 0; iy < numTilesY; iy++) {
                for (let ix = 0; ix < numTilesX; ix++) {
                    const tileX = minX + ix * viewportW;
                    const tileY = minY + iy * viewportH;

                    designerCanvas.canvasOffset = { x: -tileX, y: -tileY };
                    // Wait for CSS transform to apply and video stream to capture the updated frame
                    await sleep(300);

                    const dataUrl = await Screenshot.takeScreenshot(
                        viewportElement,
                        captureW,
                        captureH
                    );

                    const img = await this._loadImage(dataUrl);
                    finalCtx.drawImage(img, ix * captureW, iy * captureH);
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