import { IBinding } from "../services/bindingsService/IBinding";

export class CssCombiner {
  private static _helperElement = document.createElement('div');

  //todo: inset, 
  
  static combine(styles: Map<string, string | IBinding>, globalStyles?: Map<string, string>) {
    let e = CssCombiner._helperElement;
    e.setAttribute('style', '');
    for (let s of styles) {
      e.style[s[0]] = s[1];
    }
    CssCombiner.combineBorder(styles);
    CssCombiner.combineMargin(styles);
    CssCombiner.combinePadding(styles);
    CssCombiner.combineBackground(styles);
    CssCombiner.combineFont(styles);

    if (globalStyles) {
      for (let g of globalStyles) {
        if (styles.has(g[0])) {
          if (styles.get(g[0]) === g[1])
            styles.delete(g[0]);
        }
      }
    }
    return styles;
  }

  private static combineBorder(styles: Map<string, string | IBinding>) {
    let e = CssCombiner._helperElement;
    let bls = e.style.borderLeftStyle;
    let blc = e.style.borderLeftColor;
    if (bls && blc &&
      e.style.borderRightStyle === bls && e.style.borderTopStyle === bls && e.style.borderBottomStyle === bls &&
      e.style.borderRightColor === blc && e.style.borderTopColor === blc && e.style.borderBottomColor === blc) {
      let btw = e.style.borderTopWidth;
      let brw = e.style.borderRightWidth;
      let bbw = e.style.borderBottomWidth;
      let blw = e.style.borderLeftWidth;

      styles.delete('border-left-style');
      styles.delete('border-right-style');
      styles.delete('border-top-style');
      styles.delete('border-bottom-style');
      styles.delete('border-left-color');
      styles.delete('border-right-color');
      styles.delete('border-top-color');
      styles.delete('border-bottom-color');
      styles.delete('border-left-width');
      styles.delete('border-right-width');
      styles.delete('border-top-width');
      styles.delete('border-bottom-width');
      styles.delete('border-width');
      styles.delete('border-style');
      styles.delete('border-color');
      styles.delete('border-top');
      styles.delete('border-right');
      styles.delete('border-left');
      styles.delete('border-bottom');

      if (e.style.borderRightWidth == blw && e.style.borderTopWidth === blw && e.style.borderBottomWidth === blw) {
        styles.set('border', blw + ' ' + bls + ' ' + blc);
      } else {
        styles.set('border', bls + ' ' + blc);
        if (btw === bbw && brw === blw) {
          styles.set('border-width', btw + ' ' + brw);
        } else {
          styles.set('border-width', btw + ' ' + brw + ' ' + bbw + ' ' + blw);
        }
      }
    }

    if (e.style.borderImageSource === 'initial')
      styles.delete('border-image-source');
    if (e.style.borderImageSlice === 'initial')
      styles.delete('border-image-slice');
    if (e.style.borderImageWidth === 'initial')
      styles.delete('border-image-width');
    if (e.style.borderImageOutset === 'initial')
      styles.delete('border-image-outset');
    if (e.style.borderImageRepeat === 'initial')
      styles.delete('border-image-repeat');
  }

  private static combineMargin(styles: Map<string, string | IBinding>) {
    let e = CssCombiner._helperElement;
    if (e.style.marginTop && e.style.marginRight && e.style.marginBottom && e.style.marginLeft) {
      styles.delete('margin-top');
      styles.delete('margin-right');
      styles.delete('margin-bottom');
      styles.delete('margin-left');
      styles.set('margin', e.style.marginTop + ' ' + e.style.marginRight + ' ' + e.style.marginBottom + ' ' + e.style.marginLeft);
    }
  }

  private static combinePadding(styles: Map<string, string | IBinding>) {
    let e = CssCombiner._helperElement;
    if (e.style.paddingTop && e.style.paddingRight && e.style.paddingBottom && e.style.paddingLeft) {
      styles.delete('padding-top');
      styles.delete('padding-right');
      styles.delete('padding-bottom');
      styles.delete('padding-left');
      styles.set('padding', e.style.paddingTop + ' ' + e.style.paddingRight + ' ' + e.style.paddingBottom + ' ' + e.style.paddingLeft);
    }
  }

  private static combineBackground(styles: Map<string, string | IBinding>) {
    let e = CssCombiner._helperElement;
    styles.delete('background-image');
    styles.delete('background-position');
    styles.delete('background-position-x'); //TODO
    styles.delete('background-position-y'); //TODO
    styles.delete('background-size');
    styles.delete('background-repeat');
    styles.delete('background-repeat-x'); //TODO
    styles.delete('background-repeat-y'); //TODO
    styles.delete('background-attachment');
    styles.delete('background-origin');
    styles.delete('background-clip');
    styles.delete('background-color');
    styles.delete('background');

    let background = '';
    if (e.style.backgroundImage && e.style.backgroundImage !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundImage;
    if (e.style.backgroundPosition && e.style.backgroundPosition !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundPosition;
    if (e.style.backgroundSize && e.style.backgroundSize !== 'initial')
      background += (background === '' ? '' : ' / ') + e.style.backgroundSize;
    if (e.style.backgroundRepeat && e.style.backgroundRepeat !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundRepeat;
    if (e.style.backgroundAttachment && e.style.backgroundAttachment !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundAttachment;
    if (e.style.backgroundOrigin && e.style.backgroundOrigin !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundOrigin;
    if (e.style.backgroundClip && e.style.backgroundClip !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundClip;
    if (e.style.backgroundColor && e.style.backgroundColor !== 'initial')
      background += (background === '' ? '' : ' ') + e.style.backgroundColor;

    if (background)
      styles.set('background', background);
  }

  private static combineFont(styles: Map<string, string | IBinding>) {
    let e = CssCombiner._helperElement;
    if (e.style.fontFamily) {
      styles.delete('font-style');
      styles.delete('font-weight');
      styles.delete('font-size');
      styles.delete('line-height');
      styles.delete('font-family');
      styles.delete('font');

      let font = '';
      if (e.style.fontStyle)
        font += (font === '' ? '' : ' ') + e.style.fontStyle;
      if (e.style.fontWeight)
        font += (font === '' ? '' : ' ') + e.style.fontWeight;
      if (e.style.fontSize)
        font += (font === '' ? '' : ' ') + e.style.fontSize;
      if (e.style.lineHeight)
        font += '/' + e.style.lineHeight;
      if (e.style.fontFamily)
        font += (font === '' ? '' : ' ') + e.style.fontFamily;
      styles.set('font', font);
    }
  }
}