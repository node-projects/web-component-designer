export type BarcodeOptions = {
    format?: BarcodeFormat;
    width?: number;
    height?: number;
    displayValue?: boolean;
    text?: string;
    fontOptions?: string;
    font?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    fontSize?: number;
    background?: string;
    lineColor?: string;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    flat?: boolean;
    valid?: Function;
}

export enum BarcodeFormat {
    CODE128 = "CODE128",
    // CODE128A = "CODE128A",
    // CODE128B = "CODE128B",
    // CODE123C = "CODE128C",
    // CODE39 = "CODE39",
    // EAN2 = "EAN2",
    // EAN5 = "EAN5",
    // EAN8 = "EAN8",
    EAN13 = "EAN13",
    // UPC = "UPC",
    QR = 'QR',
}