import {
    DesignItem, hideAtRunTimeAttributeName, IDesignItem, IHtmlParserService,
    IHtmlWriterOptions, IHtmlWriterService, InstanceServiceContainer, ITextWriter,
    ServiceContainer
} from '@node-projects/web-component-designer';
import { attributesForBarcode, barcodeCommandRegistry, BarcodeByState, BarcodeDefinition, getBarcodeFieldOriginOffset, readBarcodeProps } from '../barcodes/barcodeRegistry.js';
import { barcodeFieldOriginAboveOffset, barcodeHorizontalInsets } from '../barcodes/bwipRenderer.js';
import { ZplBarcode } from '../widgets/zpl-barcode.js';
import { ZplComment } from '../widgets/zpl-comment.js';
import { ZplGraphicBox } from '../widgets/zpl-graphic-box.js';
import { ZplGraphicCircle } from '../widgets/zpl-graphic-circle.js';
import { ZplGraphicDiagonalLine } from '../widgets/zpl-graphic-diagonal-line.js';
import { ZplImage } from '../widgets/zpl-image.js';
import { getZplTextOutputOffset, ZplText } from '../widgets/zpl-text.js';
import { createHiddenZplComments, hiddenPayloads, tokenizeZpl } from './hiddenMetadata.js';
export { createHiddenZplComments, decodeHiddenZplComments, tokenizeZpl } from './hiddenMetadata.js';

interface GraphicDefinition {
    name: string;
    totalBytes: number;
    bytesPerRow: number;
    hexData: string;
}


const first = (...values: (string | number | undefined | null)[]) => values.find(value => value !== '' && value != null && value !== 'NaN');

/** Zebra uses zero/omitted width as the natural aspect ratio. */
export const parseZplFontWidth = (value: string | undefined) => Number(first(value, 0));

function setPosition(element: HTMLElement, x: number, y: number) {
    element.style.position = 'absolute';
    element.style.left = `${Number.isFinite(x) ? x : 0}px`;
    element.style.top = `${Number.isFinite(y) ? y : 0}px`;
}

function designItem(element: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    return DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
}

export class ZplParserService implements IHtmlParserService, IHtmlWriterService {
    options: IHtmlWriterOptions = {};

    async parse(source: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, _parseSnippet: boolean): Promise<IDesignItem[]> {
        return this._parse(source, serviceContainer, instanceServiceContainer, true);
    }

    private async _parse(source: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, includeHidden: boolean): Promise<IDesignItem[]> {
        const tokens = tokenizeZpl(source);
        const hidden = includeHidden ? hiddenPayloads(tokens) : [];
        const validMetadataComments = new Set(hidden.flatMap(payload => [...payload.comments]));
        const graphics = new Map<string, GraphicDefinition>();
        const result: IDesignItem[] = [];
        let x = 0;
        let y = 0;
        let fontName = '0';
        let fontHeight = 30;
        let fontWidth = 0;
        let fontRotation = 'N';
        let by: BarcodeByState = { moduleWidth: 2, wideRatio: 3, barHeight: 100 };
        let pendingBarcode: { element: ZplBarcode; definition: BarcodeDefinition; outputX: number; outputY: number } | null = null;

        for (const token of tokens) {
            const fields = token.data.split(',');
            if (token.prefix === '~' && token.command === 'DG') {
                const name = fields[0].replace(/^[A-Z]:/i, '');
                graphics.set(name, { name, totalBytes: Number(fields[1]), bytesPerRow: Number(fields[2]), hexData: fields.slice(3).join(',') });
                continue;
            }
            if (token.prefix !== '^') continue;
            if (token.command === 'FO') {
                x = Number(fields[0]) || 0;
                y = Number(fields[1]) || 0;
            } else if (token.command === 'CF') {
                fontName = fields[0] || '0';
                fontHeight = Number(first(fields[1], 30));
                // An omitted width means the font's natural aspect ratio. For
                // bitmap fonts A-H this also means "use the height
                // magnification"; substituting the numeric height would pick
                // a different (usually much wider) cell magnification.
                fontWidth = parseZplFontWidth(fields[2]);
                fontRotation = 'N';
            } else if (token.command[0] === 'A' && /^[0A-H]$/.test(token.command[1])) {
                fontName = token.command[1];
                fontRotation = fields[0] || 'N';
                fontHeight = Number(first(fields[1], fontHeight, 30));
                fontWidth = parseZplFontWidth(fields[2]);
            } else if (token.command === 'BY') {
                by = {
                    moduleWidth: Number(first(fields[0], by.moduleWidth, 2)),
                    wideRatio: Number(first(fields[1], by.wideRatio, 3)),
                    barHeight: Number(first(fields[2], by.barHeight, 100))
                };
            } else if (barcodeCommandRegistry[token.command]) {
                const definition = barcodeCommandRegistry[token.command];
                const element = new ZplBarcode();
                const values = definition.parse(fields, by);
                const attributes = attributesForBarcode(definition.type, values);
                for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
                pendingBarcode = { element, definition, outputX: x, outputY: y };
            } else if (token.command === 'FD') {
                if (pendingBarcode) {
                    let content = token.data;
                    if (pendingBarcode.definition.type === 'qrcode') {
                        const prefix = content.match(/^([HQML])A,/);
                        if (prefix) {
                            pendingBarcode.element.setAttribute('error-correction', prefix[1]);
                            content = content.slice(prefix[0].length);
                        }
                    }
                    pendingBarcode.element.setAttribute('content', content);
                    const props = readBarcodeProps(pendingBarcode.element);
                    const offset = getBarcodeFieldOriginOffset(props.type, props.rotation);
                    const aboveOffset = props.rotation === 'N' ? barcodeFieldOriginAboveOffset(props) : 0;
                    const horizontalOffset = props.rotation === 'N' ? barcodeHorizontalInsets(props).left : 0;
                    setPosition(pendingBarcode.element, pendingBarcode.outputX - offset.x - horizontalOffset, pendingBarcode.outputY - offset.y - aboveOffset);
                    result.push(designItem(pendingBarcode.element, serviceContainer, instanceServiceContainer));
                    pendingBarcode = null;
                } else {
                    const element = new ZplText();
                    const offset = getZplTextOutputOffset(fontRotation as 'N' | 'R' | 'I' | 'B');
                    setPosition(element, x - offset.x, y - offset.y);
                    element.setAttribute('font-name', fontName);
                    element.setAttribute('font-height', String(fontHeight));
                    element.setAttribute('font-width', String(fontWidth));
                    element.setAttribute('rotation', fontRotation);
                    element.setAttribute('content', token.data);
                    result.push(designItem(element, serviceContainer, instanceServiceContainer));
                }
            } else if (token.command === 'GB') {
                const element = new ZplGraphicBox();
                setPosition(element, x, y);
                element.style.width = `${Number(first(fields[0], fields[2], 1))}px`;
                element.style.height = `${Number(first(fields[1], fields[2], 1))}px`;
                element.setAttribute('stroke-width', String(first(fields[2], 1)));
                element.setAttribute('stroke-color', fields[3] === 'W' ? 'white' : 'black');
                element.setAttribute('corner-rounding', String(first(fields[4], 0)));
                result.push(designItem(element, serviceContainer, instanceServiceContainer));
            } else if (token.command === 'GD') {
                const element = new ZplGraphicDiagonalLine();
                setPosition(element, x, y);
                element.style.width = `${Number(first(fields[0], fields[2], 1))}px`;
                element.style.height = `${Number(first(fields[1], fields[2], 1))}px`;
                element.setAttribute('stroke-width', String(first(fields[2], 1)));
                element.setAttribute('stroke-color', fields[3] === 'W' ? 'white' : 'black');
                element.setAttribute('orientation', String(first(fields[4], 'R')));
                result.push(designItem(element, serviceContainer, instanceServiceContainer));
            } else if (token.command === 'GE') {
                const element = new ZplGraphicCircle();
                setPosition(element, x, y);
                element.style.width = `${Number(first(fields[0], fields[2], 1))}px`;
                element.style.height = `${Number(first(fields[1], fields[2], 1))}px`;
                element.setAttribute('stroke-width', String(first(fields[2], 1)));
                element.setAttribute('stroke-color', fields[3] === 'W' ? 'white' : 'black');
                result.push(designItem(element, serviceContainer, instanceServiceContainer));
            } else if (token.command === 'XG') {
                const name = fields[0].replace(/^[A-Z]:/i, '');
                const graphic = graphics.get(name);
                if (!graphic) continue;
                const element = new ZplImage();
                setPosition(element, x, y);
                element.setAttribute('total-bytes', String(graphic.totalBytes));
                element.setAttribute('bytes-per-row', String(graphic.bytesPerRow));
                element.setAttribute('image-name', name);
                element.setAttribute('hex-image', graphic.hexData);
                element.setAttribute('scale-x', String(first(fields[1], 1)));
                element.setAttribute('scale-y', String(first(fields[2], 1)));
                result.push(designItem(element, serviceContainer, instanceServiceContainer));
            } else if (token.command === 'FX' && !validMetadataComments.has(token.data)) {
                const element = new ZplComment();
                setPosition(element, x, y);
                element.setAttribute('content', token.data);
                result.push(designItem(element, serviceContainer, instanceServiceContainer));
            }
        }

        for (const payload of hidden) {
            const hiddenItems = await this._parse(payload.zpl, serviceContainer, instanceServiceContainer, false);
            for (const item of hiddenItems) item._withoutUndoSetAttribute(hideAtRunTimeAttributeName, '');
            result.splice(Math.min(payload.index, result.length), 0, ...hiddenItems);
        }
        return result;
    }

    write(textWriter: ITextWriter, designItems: IDesignItem[], _rootContainerKeepInline: boolean, updatePositions?: boolean) {
        textWriter.writeLine('^XA');
        for (const designItem of designItems) {
            if (!designItem.hideAtRunTime && designItem.element instanceof ZplImage) {
                textWriter.writeLine(designItem.element.createZplImage());
            }
        }
        for (let index = 0; index < designItems.length; index++) {
            const designItem = designItems[index];
            const start = textWriter.position;
            if (designItem.hideAtRunTime) {
                const miniLines = ['^XA'];
                if (designItem.element instanceof ZplImage) miniLines.push(designItem.element.createZplImage());
                const createZpl = (designItem.element as HTMLElement & { createZpl?: () => string }).createZpl;
                if (createZpl) miniLines.push(createZpl.call(designItem.element));
                miniLines.push('^XZ');
                for (const comment of createHiddenZplComments(index, miniLines.join('\n'))) textWriter.writeLine(comment);
            } else {
                const createZpl = (designItem.element as HTMLElement & { createZpl?: () => string }).createZpl;
                if (createZpl) textWriter.writeLine(createZpl.call(designItem.element));
            }
            const end = textWriter.position;
            if (updatePositions && designItem.instanceServiceContainer.designItemDocumentPositionService) {
                designItem.instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start, length: end - start });
            }
        }
        textWriter.writeLine('^XZ');
    }
}
