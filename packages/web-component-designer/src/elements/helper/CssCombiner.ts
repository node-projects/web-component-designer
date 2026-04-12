export class CssCombiner {
  private static _helperElement = document.createElement('div');

  static combine(styles: Map<string, string>, globalStyles?: Map<string, string>) {
    CssCombiner.applyStylesToHelper(styles);
    CssCombiner.combineBorder(styles);
    CssCombiner.combineMargin(styles);
    CssCombiner.combinePadding(styles);
    CssCombiner.combineInset(styles);
    CssCombiner.combineBackground(styles);
    CssCombiner.combineFont(styles);
    styles = CssCombiner.combineBrowserSupportedShorthands(styles);

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

  private static applyStylesToHelper(styles: Map<string, string>) {
    let e = CssCombiner._helperElement;
    e.setAttribute('style', '');
    for (let s of styles) {
      if (s[0].startsWith('--') || s[0].includes('-'))
        e.style.setProperty(s[0], s[1]);
      else
        (<any>e.style)[s[0]] = s[1];
    }
    return e;
  }

  private static combineBrowserSupportedShorthands(styles: Map<string, string>) {
    const originalNormalizedValues = CssCombiner.getNormalizedStyleValues(styles);
    let combinedStyles = new Map(styles);

    while (true) {
      const candidateStyles = CssCombiner.parseStyleDeclarationList(CssCombiner.applyStylesToHelper(combinedStyles).style.cssText);
      let bestCandidate: Map<string, string> | null = null;
      let bestSavings = 0;

      for (let candidate of candidateStyles) {
        const coverage = CssCombiner.getCandidateCoverage(combinedStyles, originalNormalizedValues, candidate[0], candidate[1]);
        if (coverage.length === 0)
          continue;

        let tentativeStyles = new Map(combinedStyles);
        for (let coveredStyle of coverage)
          tentativeStyles.delete(coveredStyle);
        tentativeStyles.set(candidate[0], candidate[1]);

        const savings = CssCombiner.getSerializedSize(combinedStyles) - CssCombiner.getSerializedSize(tentativeStyles);
        if (savings <= 0)
          continue;

        if (!CssCombiner.matchesNormalizedStyleValues(tentativeStyles, originalNormalizedValues))
          continue;

        if (savings > bestSavings) {
          bestSavings = savings;
          bestCandidate = tentativeStyles;
        }
      }

      if (!bestCandidate)
        return combinedStyles;

      combinedStyles = bestCandidate;
    }
  }

  private static getNormalizedStyleValues(styles: Map<string, string>) {
    const element = CssCombiner.applyStylesToHelper(styles);
    const normalizedValues = new Map<string, string>();

    for (let style of styles)
      normalizedValues.set(style[0], CssCombiner.readStyleValue(element.style, style[0]));

    return normalizedValues;
  }

  private static getCandidateCoverage(styles: Map<string, string>, originalNormalizedValues: Map<string, string>, candidateName: string, candidateValue: string) {
    const element = CssCombiner.applyStylesToHelper(new Map([[candidateName, candidateValue]]));
    const coverage: string[] = [];

    for (let style of styles) {
      const originalValue = originalNormalizedValues.get(style[0]);
      if (!originalValue)
        continue;

      if (CssCombiner.readStyleValue(element.style, style[0]) === originalValue)
        coverage.push(style[0]);
    }

    return coverage;
  }

  private static matchesNormalizedStyleValues(styles: Map<string, string>, originalNormalizedValues: Map<string, string>) {
    const element = CssCombiner.applyStylesToHelper(styles);

    for (let normalizedValue of originalNormalizedValues) {
      if (CssCombiner.readStyleValue(element.style, normalizedValue[0]) !== normalizedValue[1])
        return false;
    }

    return true;
  }

  private static readStyleValue(style: CSSStyleDeclaration, name: string) {
    if (name.startsWith('--') || name.includes('-'))
      return style.getPropertyValue(name).trim();

    return String((<any>style)[name] ?? '').trim();
  }

  private static getSerializedSize(styles: Map<string, string>) {
    let size = 0;
    for (let style of styles)
      size += style[0].length + style[1].length + 2;
    return size;
  }

  private static parseStyleDeclarationList(cssText: string) {
    let styles = new Map<string, string>();
    let start = 0;
    let quote: string | null = null;
    let parenthesisDepth = 0;

    for (let i = 0; i < cssText.length; i++) {
      const c = cssText[i];
      if (quote) {
        if (c === quote && cssText[i - 1] !== '\\')
          quote = null;
        continue;
      }

      if (c === '"' || c === '\'') {
        quote = c;
        continue;
      }

      if (c === '(') {
        parenthesisDepth++;
        continue;
      }
      if (c === ')' && parenthesisDepth > 0) {
        parenthesisDepth--;
        continue;
      }

      if (c === ';' && parenthesisDepth === 0) {
        CssCombiner.addStyleDeclaration(styles, cssText.substring(start, i));
        start = i + 1;
      }
    }

    CssCombiner.addStyleDeclaration(styles, cssText.substring(start));
    return styles;
  }

  private static addStyleDeclaration(styles: Map<string, string>, declaration: string) {
    const trimmedDeclaration = declaration.trim();
    if (!trimmedDeclaration)
      return;

    let quote: string | null = null;
    let parenthesisDepth = 0;

    for (let i = 0; i < trimmedDeclaration.length; i++) {
      const c = trimmedDeclaration[i];
      if (quote) {
        if (c === quote && trimmedDeclaration[i - 1] !== '\\')
          quote = null;
        continue;
      }

      if (c === '"' || c === '\'') {
        quote = c;
        continue;
      }

      if (c === '(') {
        parenthesisDepth++;
        continue;
      }
      if (c === ')' && parenthesisDepth > 0) {
        parenthesisDepth--;
        continue;
      }

      if (c === ':' && parenthesisDepth === 0) {
        const name = trimmedDeclaration.substring(0, i).trim();
        const value = trimmedDeclaration.substring(i + 1).trim();
        if (name)
          styles.set(name, value);
        return;
      }
    }
  }

  private static combineBorder(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-left-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-right-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-top-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-bottom-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-left-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-right-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-top-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-bottom-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-left-width')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-right-width')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-top-width')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-bottom-width')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-width')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-top')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-right')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-left')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-bottom')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'border-width')) return;

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

  private static combineMargin(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'margin-top')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'margin-right')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'margin-bottom')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'margin-left')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'margin')) return;

    let e = CssCombiner._helperElement;
    if (e.style.marginTop && e.style.marginRight && e.style.marginBottom && e.style.marginLeft) {
      styles.delete('margin-top');
      styles.delete('margin-right');
      styles.delete('margin-bottom');
      styles.delete('margin-left');
      if (e.style.marginTop == e.style.marginRight && e.style.marginTop == e.style.marginBottom && e.style.marginTop == e.style.marginLeft) {
        styles.set('margin', e.style.marginTop);
      } else
        styles.set('margin', e.style.marginTop + ' ' + e.style.marginRight + ' ' + e.style.marginBottom + ' ' + e.style.marginLeft);
    }
  }

  private static combinePadding(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'padding-top')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'padding-right')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'padding-bottom')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'padding-left')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'padding')) return;

    let e = CssCombiner._helperElement;
    if (e.style.paddingTop && e.style.paddingRight && e.style.paddingBottom && e.style.paddingLeft) {
      styles.delete('padding-top');
      styles.delete('padding-right');
      styles.delete('padding-bottom');
      styles.delete('padding-left');
      if (e.style.paddingTop == e.style.paddingRight && e.style.paddingTop == e.style.paddingBottom && e.style.paddingTop == e.style.paddingLeft) {
        styles.set('padding', e.style.paddingTop);
      } else
        styles.set('padding', e.style.paddingTop + ' ' + e.style.paddingRight + ' ' + e.style.paddingBottom + ' ' + e.style.paddingLeft);
    }
  }

  private static combineInset(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'top')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'right')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'bottom')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'left')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'inset')) return;

    let e = CssCombiner._helperElement;
    if (e.style.top && e.style.right && e.style.bottom && e.style.left) {
      styles.delete('top');
      styles.delete('right');
      styles.delete('bottom');
      styles.delete('left');
      styles.set('inset', e.style.top + ' ' + e.style.right + ' ' + e.style.bottom + ' ' + e.style.left);
    }
  }

  private static combineBackground(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-image')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-position')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-position-x')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-position-y')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-size')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-repeat')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-repeat-x')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-repeat-y')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-attachment')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-origin')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-clip')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background-color')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'background')) return;

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

  private static combineFont(styles: Map<string, string>) {
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'font-style')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'font-weight')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'font-size')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'line-height')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'font-family')) return;
    if (!CssCombiner.checkIfStyleIsCombinable(styles, 'font')) return;

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

  private static checkIfStyleIsCombinable(styles: Map<string, string>, name: string) {
    if (styles.has(name)) {
      const st = styles.get(name);
      if (typeof st == 'string') {
        if (st.startsWith('var('))
          return false;
        return true;
      }
      return false;
    }
    return true;
  }
}