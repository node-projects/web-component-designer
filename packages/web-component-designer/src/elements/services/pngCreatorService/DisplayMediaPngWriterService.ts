import { IDesignItem } from "../../item/IDesignItem.js";
import { IPngCreatorService } from "./IPngCreatorService.js";

//TODO: implement this service using the screenshot class.
//It should calculate the bounding rect of all design items, add the margin and then use the screenshot class to take a screenshot of that area. 
//If not all design items are in the viewport, it should scroll to the area where the design items are and then take the screenshot. 
//Also if not all designitems fit into the viewport, it should take multiple screenshots and stitch them together to create the final png.

//
export class DisplayMediaPngWriterService implements IPngCreatorService {
    async takePng(designItems: IDesignItem[], margin: number): Promise<Uint8Array> {
        // Implementation goes here

        const designerCanvas = designItems[0].instanceServiceContainer.designerCanvas;
        const oldZoomFactor = designerCanvas.zoomFactor;
        const oldPos = designerCanvas.canvasOffset;


        designerCanvas.zoomFactor = 1;

        //use this for the element coordinates:
        designerCanvas.getNormalizedElementCoordinates(designItems[0].element);

        //use designerCanvas.canvasOffset to move the canvas to the correct position.
//use designerCanvas.canvas.offsetWidth and designerCanvas.canvas.offsetHeight to get the size of the canvas and then use that to calculate how many screenshots we need to take and where to scroll to.

        return null;
    }
}