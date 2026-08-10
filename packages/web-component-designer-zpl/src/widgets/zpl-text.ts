import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";
import { ZplFontName, blockLineStep, getZplTextMetrics, isBitmapFont, justifyOffset, justifyWordSpacing, predictTextWidth, wrapZplLines } from "../zplFontMetrics.js";
import { ZPL_FONT_0_FAMILY, ZPL_FONT_A_FAMILY, capTopOffset, measureFontRatios, measureTextWidth } from "../zplFontMeasure.js";

enum Justifications {
    Left = "L",
    Center = "C",
    Right = "R",
    Justified = "J",
}

enum FontNames {
    Font_0 = "0",
    Font_A = "A",
    Font_B = "B",
    Font_C = "C",
    Font_D = "D",
    Font_E = "E",
    Font_F = "F",
    Font_G = "G",
    Font_H = "H",
}

export class ZplText extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css`
    *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="text-div" style="width: 100%; height: 100%; pointer-events: none">
    </div>
    `;

    static readonly is = 'zpl-text';

    public content: string;
    public fontName: string;
    public fontHeight: number;
    /**
     * The w parameter of ^A / ^CF. 0 means "derive from the height", which
     * keeps font 0 at its natural aspect and a bitmap font on a square scale.
     * That is the sensible default; an explicit width only ever distorts.
     */
    public fontWidth: number = 0;

    /** ^FB block width in dots. 0 means the field is not a block. */
    public blockWidth: number = 0;
    /** ^FB maximum number of lines. */
    public maxLines: number = 1;
    /** ^FB dots added between lines; may be negative. */
    public lineSpacing: number = 0;
    /** ^FB justification: L, C, R or J. */
    public justification: string = 'L';
    /** ^FB hanging indent applied to every line after the first. */
    public hangingIndent: number = 0;

    private _text: HTMLDivElement;

    static readonly properties = {
        content: String,
        fontName: FontNames,
        fontHeight: Number,
        fontWidth: Number,
        blockWidth: Number,
        maxLines: Number,
        lineSpacing: Number,
        justification: Justifications,
        hangingIndent: Number
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._text = this._getDomElement<HTMLDivElement>("text-div");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._layout();
    }

    /**
     * Lay the text out so it occupies the same dots a printer would use.
     *
     * ZPL puts the top of the capital letters exactly on the ^FO y coordinate,
     * so this element's top edge is the cap top and the text is shifted up by
     * whatever ascent the CSS font puts above its capitals. See zplFontMetrics
     * for the measurements these rules come from.
     */
    private _layout() {
        const font = <ZplFontName>(this.fontName || '0');
        const bitmap = isBitmapFont(font);
        const metrics = getZplTextMetrics(font, this.fontHeight, this.fontWidth);
        const text = this._text;

        const fontFamily = bitmap ? ZPL_FONT_A_FAMILY : ZPL_FONT_0_FAMILY;
        const fontWeight = bitmap ? 'normal' : 'bold';

        text.style.transformOrigin = '0 0';
        text.style.whiteSpace = 'pre';
        text.style.fontKerning = 'none';
        text.style.lineHeight = '1';
        text.style.fontFamily = fontFamily;
        text.style.fontWeight = fontWeight;
        text.style.letterSpacing = 'normal';

        const ratios = measureFontRatios(fontFamily, fontWeight);

        // Size the glyphs so their cap height equals the ZPL cap height.
        const fontSize = ratios.capRatio > 0 ? metrics.capHeight / ratios.capRatio : metrics.capHeight;
        text.style.fontSize = fontSize + 'px';

        // The bitmap fonts are fixed pitch with an exactly known advance, so
        // pin it. letter-spacing is added after each glyph, before the scaleX.
        if (bitmap && metrics.advance != null) {
            const natural = ratios.advanceRatio * fontSize;
            text.style.letterSpacing = ((metrics.advance / metrics.scaleX) - natural) + 'px';
        }

        // Lift the text so the cap top, not the line box top, sits at y = 0.
        text.style.marginTop = (-capTopOffset(fontSize, ratios)) + 'px';
        text.style.position = 'relative';

        // Width of a string in printed dots. Exact for the bitmap fonts;
        // measured from the CSS font for the proportional font 0.
        const measure = (s: string): number => {
            const exact = predictTextWidth(font, this.fontHeight, this.fontWidth, s);
            if (exact != null) return exact;
            return measureTextWidth(s, fontSize, fontFamily, fontWeight) * metrics.scaleX;
        };

        const content = this.content ?? '';
        const step = blockLineStep(metrics.cellHeight, this.lineSpacing);
        const lines = this.blockWidth > 0
            ? wrapZplLines(content, this.blockWidth, this.maxLines, measure)
            : [content];

        // One positioned div per line so each can be justified independently.
        text.textContent = '';
        lines.forEach((line, i) => {
            const div = document.createElement('div');
            div.textContent = line;
            div.style.position = 'absolute';
            div.style.whiteSpace = 'pre';
            div.style.transformOrigin = '0 0';
            div.style.transform = 'scaleX(' + metrics.scaleX + ')';
            div.style.top = (i * step) + 'px';
            const indent = i > 0 ? (this.hangingIndent || 0) : 0;
            const lineWidth = measure(line);
            // 'J' stretches every wrapped line but the last to fill the block;
            // the last line of the field prints ragged, like left-aligned text.
            if (this.justification === 'J' && i < lines.length - 1) {
                const gapCount = (line.match(/ /g) || []).length;
                const extra = justifyWordSpacing(lineWidth, this.blockWidth, gapCount);
                // Undo the div's scaleX transform, which would otherwise also
                // stretch the spacing itself (same trick as the letter-spacing
                // above).
                if (extra > 0) div.style.wordSpacing = (extra / metrics.scaleX) + 'px';
            }
            div.style.left = (indent + justifyOffset(
                this.justification, this.blockWidth, lineWidth, metrics.advance)) + 'px';
            text.appendChild(div);
        });

        this.style.height = ((lines.length - 1) * step + metrics.cellHeight) + 'px';
        if (this.blockWidth > 0) {
            this.style.width = this.blockWidth + 'px';
        } else {
            // measure() already tries predictTextWidth first and only falls
            // back to a canvas measurement for the proportional font 0.
            this.style.width = measure(content) + 'px';
        }
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        // A width of 0 means "derive from the height", which is what omitting
        // the parameter does, so leave it off rather than writing an explicit 0.
        zpl += "^CF" + this.fontName + "," + this.fontHeight
            + (this.fontWidth > 0 ? "," + this.fontWidth : "");
        if (this.blockWidth > 0) {
            zpl += "^FB" + this.blockWidth + "," + (this.maxLines || 1) + ","
                + (this.lineSpacing || 0) + "," + (this.justification || 'L') + ","
                + (this.hangingIndent || 0);
        }
        zpl += "^FD" + this.content
        zpl += "^FS";
        return zpl;
    }
}

customElements.define(ZplText.is, ZplText);