import { DesignItem, ITextWriter, IDesignItem, IHtmlParserService, IHtmlWriterOptions, IHtmlWriterService, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
import { ZplBarcode } from "../widgets/zpl-barcode.js";
import { ZplGraphicBox } from "../widgets/zpl-graphic-box.js";
import { ZplGraphicDiagonalLine } from "../widgets/zpl-graphic-diagonal-line.js";
import { ZplGraphicCircle } from "../widgets/zpl-graphic-circle.js";
import { ZplText } from "../widgets/zpl-text.js";
import { ZplImage } from "../widgets/zpl-image.js";
import { ZplComment } from "../widgets/zpl-comment.js";

function getSetValue(...args) {
    for (let a of args)
        if (a != '' && a != null && a != "NaN")
            return a;
}

type image = {
    name: string;
    totalBytes: number;
    bytesPerRow: number;
    hexData: string;
}

export class ZplParserService implements IHtmlParserService, IHtmlWriterService {

    options: IHtmlWriterOptions = {};

    createTransform(char: string, el: HTMLElement) {
        switch (char) {
            case 'R': {
                el.style.transform = 'rotate(90deg) translateY(-100%)';
                el.style.transformOrigin = '0% 0%'
                return;
            };
            case 'I': {
                el.style.transform = 'rotate(180deg)';
                el.style.transformOrigin = '50% 50%'
                return;
            }
            case 'B': {
                el.style.transform = 'rotate(270deg)';
                el.style.transformOrigin = '100% 100%'
                return;
            };
        }
        return;
    }

    async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
        let parts = html.split("^");
        let images: Record<string, image> = {};
        if (parts[0][0] == "~") {
            let imgStrings = parts[0].split("~");
            for (let img of imgStrings) {
                if (img == "")
                    continue
                let imgParts = img.split(",");
                images[imgParts[0].substring(2)] = {
                    name: imgParts[0].substring(2),
                    totalBytes: parseInt(imgParts[1]),
                    bytesPerRow: parseInt(imgParts[2]),
                    hexData: imgParts[3]
                }
            }
        }
        let designItems: IDesignItem[] = [];
        let fontName: string;
        let fontHeight: number;
        let fontWidth: number;
        let rotation: string = 'N';
        let x: number;
        let y: number;
        let bc: boolean;
        let qr: boolean;
        let bw: number;
        let bh: number;
        let br: number;
        // let bo: string;
        let barcode: ZplBarcode;

        //let a: number;
        for (let p of parts) {
            p = p.replaceAll("\n", "");
            p = p.replaceAll("\r", "");
            let command = p.substring(0, 2);
            let fieldString = p.substring(2);
            let fields = fieldString.split(",");

            switch (command) {
                case "XA":
                case "XZ":
                    break;
                case "FX":
                    let comment = new ZplComment();
                    comment.style.position = "absolute";
                    comment.style.left = x + "px";
                    comment.style.top = y + "px";
                    comment.setAttribute("content", fieldString);
                    designItems.push(DesignItem.createDesignItemFromInstance(comment, serviceContainer, instanceServiceContainer));
                    break;
                case "AA": //Ax x=fontname
                case "A0": {
                    fontName = command[1];
                    rotation = getSetValue(fields[0], 'N');
                    let defaultFontWidth = 15;
                    switch (fontName) {
                        case "A":
                            defaultFontWidth = 15;
                            break;
                        case "0":
                            defaultFontWidth = fontHeight;
                    }
                    fontHeight = parseInt(getSetValue(fields[1], defaultFontWidth));
                    fontWidth = parseInt(getSetValue(fields[2], defaultFontWidth));
                    break;
                }
                case "CF": //we should switch to use A, CF is default font
                    rotation = 'N';
                    fontName = fields[0];
                    fontHeight = parseInt(fields[1]);
                    let defaultFontWidth = 15;
                    switch (fontName) {
                        case "A":
                            defaultFontWidth = 15;
                            break;
                        case "0":
                            defaultFontWidth = fontHeight;
                    }
                    fontWidth = parseInt(getSetValue(fields[2], defaultFontWidth));
                    break;
                case "FO":
                    x = parseInt(fields[0]);
                    y = parseInt(fields[1]);
                    //a = parseInt(fields[2]);
                    break;
                case "GB":
                    let rect = new ZplGraphicBox();
                    rect.style.position = "absolute";
                    rect.style.left = x + "px";
                    rect.style.top = y + "px";
                    rect.style.width = getSetValue(fields[0], fields[2], '1') + "px";
                    rect.style.height = getSetValue(fields[1], fields[2], '1') + "px";
                    rect.setAttribute("stroke-width", getSetValue(fields[2], '1'));
                    rect.setAttribute("stroke-color", getSetValue(fields[3], 'B') == "B" ? "black" : "white");
                    rect.setAttribute("corner-rounding", getSetValue(fields[4], '0'));
                    designItems.push(DesignItem.createDesignItemFromInstance(rect, serviceContainer, instanceServiceContainer));
                    break;
                case "GD":
                    let line = new ZplGraphicDiagonalLine();
                    line.style.position = "absolute";
                    line.style.left = x + "px";
                    line.style.top = y + "px";
                    line.style.width = getSetValue(fields[0], fields[2], '1') + "px";
                    line.style.height = getSetValue(fields[1], fields[2], '1') + "px";
                    line.setAttribute("stroke-width", getSetValue(fields[2], '1'));
                    line.setAttribute("stroke-color", getSetValue(fields[3], 'B') == "B" ? "black" : "white");
                    line.setAttribute("orientation", getSetValue(fields[4], 'R'));
                    designItems.push(DesignItem.createDesignItemFromInstance(line, serviceContainer, instanceServiceContainer));
                    break;
                case "GE":
                    let circle = new ZplGraphicCircle();
                    circle.style.position = "absolute";
                    circle.style.left = x + "px";
                    circle.style.top = y + "px";
                    circle.style.width = getSetValue(fields[0], fields[2], '1') + "px";
                    circle.style.height = getSetValue(fields[1], fields[2], '1') + "px";
                    circle.setAttribute("stroke-width", getSetValue(fields[2], '1'));
                    circle.setAttribute("stroke-color", getSetValue(fields[3], 'B') == "B" ? "black" : "white");
                    designItems.push(DesignItem.createDesignItemFromInstance(circle, serviceContainer, instanceServiceContainer));
                    break;
                case "BY":
                    bw = parseInt(getSetValue(fields[0], "2"));
                    br = parseFloat(getSetValue(fields[1], "3"));
                    bh = parseInt(getSetValue(fields[2], "10"));
                    break;
                case "BC":
                    bc = true;
                    // bo = getSetValue(fields[0], 'N');
                    barcode = new ZplBarcode();
                    barcode.style.position = "absolute";
                    barcode.style.left = x + "px";
                    barcode.style.top = y + "px";
                    barcode.setAttribute("type", "CODE128");
                    if (bw)
                        barcode.setAttribute("width", bw.toString());
                    if (br)
                        barcode.setAttribute("ratio", br.toString());
                    barcode.setAttribute("height", getSetValue(fields[1], bh).toString());
                    break;
                case "BQ":
                    qr = true;
                    bc = true;
                    // bo = getSetValue(fields[0], 'N');
                    barcode = new ZplBarcode();
                    barcode.style.position = "absolute";
                    barcode.style.left = x + "px";
                    barcode.style.top = y + "px";
                    barcode.setAttribute("type", "QR");
                    if (bw)
                        barcode.setAttribute("width", bw.toString());
                    if (br)
                        barcode.setAttribute("ratio", br.toString());
                    barcode.setAttribute("height", getSetValue(fields[2], bh).toString());
                    break;
                case "FD":
                    if (bc) {
                        if (qr)
                            barcode.setAttribute("content", fieldString.substring(3));
                        else
                            barcode.setAttribute("content", fieldString);
                        designItems.push(DesignItem.createDesignItemFromInstance(barcode, serviceContainer, instanceServiceContainer));
                        bc = false;
                        qr = false;
                    }
                    else {
                        let text = new ZplText();
                        text.style.position = "absolute";
                        text.style.left = x + "px";
                        text.style.top = y + "px";
                        text.setAttribute("font-name", fontName);
                        text.setAttribute("font-height", fontHeight.toString());
                        text.setAttribute("font-width", fontWidth.toString());
                        text.setAttribute("content", fieldString);
                        if (rotation) {
                            this.createTransform(rotation, text);
                        }
                        designItems.push(DesignItem.createDesignItemFromInstance(text, serviceContainer, instanceServiceContainer));
                    }
                    break;
                case "XG":
                    let image = new ZplImage();
                    let nm = fields[0].substring(2);
                    image.style.position = "absolute";
                    image.style.left = x + "px";
                    image.style.top = y + "px";
                    image.setAttribute("total-bytes", images[nm].totalBytes.toString());
                    image.setAttribute("bytes-per-row", images[nm].bytesPerRow.toString());
                    image.setAttribute("image-name", nm);
                    image.setAttribute("hex-image", images[nm].hexData);
                    image.setAttribute("scale-x", getSetValue(fields[1], "1"));
                    image.setAttribute("scale-y", getSetValue(fields[2], "1"));
                    designItems.push(DesignItem.createDesignItemFromInstance(image, serviceContainer, instanceServiceContainer));
                    break;
            }
        }

        return designItems;
    }

    write(textWriter: ITextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean, updatePositions?: boolean) {
        let tx = "^XA\n";
        for (let d of designItems) {
            if (d.element.nodeName == "ZPL-IMAGE") {
                //@ts-ignore
                textWriter.writeLine(d.element.createZplImage());
                //@ts-ignore
                tx += d.element.createZplImage() + '\n';
            }
        }
        for (let d of designItems) {
            //@ts-ignore
            tx += d.element.createZpl(); +'\n'
        }
        tx += "^XZ";

        textWriter.writeLine("^XA");
        // textWriter.writeLine("^FX For better view visit http://labelary.com/viewer.html?zpl=" + encodeURIComponent(tx));
        for (let d of designItems) {
            let start = textWriter.position;
            //@ts-ignore
            textWriter.writeLine(d.element.createZpl())
            let end = textWriter.position;
            if (updatePositions && d.instanceServiceContainer.designItemDocumentPositionService) {
                d.instanceServiceContainer.designItemDocumentPositionService.setPosition(d, { start: start, length: end - start });
            }
        }
        textWriter.writeLine("^XZ");
    }
}