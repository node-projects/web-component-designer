import { IElementDefinition, IElementsService } from '@node-projects/web-component-designer';
import { attributesForBarcode, barcodeRegistry, barcodeTypes } from '../barcodes/barcodeRegistry.js';

export class ZplBarcodeElementsService implements IElementsService {
    readonly name = 'zpl barcodes';

    async getElements(): Promise<IElementDefinition[]> {
        return barcodeTypes.map(type => {
            const definition = barcodeRegistry[type];
            return {
                name: definition.label,
                description: `ZPL ^${definition.command} ${definition.label}`,
                tag: 'zpl-barcode',
                type: 'webcomponent',
                defaultAttributes: attributesForBarcode(type)
            };
        });
    }
}
