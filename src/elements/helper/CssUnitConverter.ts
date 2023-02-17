//unsupported: ex, ch, svw, svh, vw, lvh, dvw, dvh

const units = ['px', 'cm', 'mm', 'q', 'in', 'pc', 'pt', 'rem', 'em', 'vw', 'vh', 'vmin', 'vmax', 'lh', 'rlh', '%', 'ms', 's', 'deg', 'rad', 'grad', 'turn', 'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax', 'fr'];
const pattern = new RegExp(`^([\-\+]?(?:\\d+(?:\\.\\d+)?))(${units.join('|')})$`, 'i');

export function convertCssUnitToPixel(cssValue: string, target: HTMLElement, percentTarget: 'width' | 'height'): number {

    if (!cssValue)
        return null;

    const supportedUnits = {

        // Absolute sizes
        'px': value => value,
        'cm': value => value * 38,
        'mm': value => value * 3.8,
        'q': value => value * 0.95,
        'in': value => value * 96,
        'pc': value => value * 16,
        'pt': value => value * 1.333333,


        // Relative sizes
        'rem': value => value * parseFloat(getComputedStyle(document.documentElement).fontSize),
        'em': value => value * parseFloat(getComputedStyle(target).fontSize),
        'vw': value => value / 100 * window.innerWidth,
        'vh': value => value / 100 * window.innerHeight,
        'vmin': value => value / 100 * (window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth),
        'vmax': value => value / 100 * (window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth),
        'lh': value => value * parseFloat(getComputedStyle(target).lineHeight),
        'rlh': value => value * parseFloat(getComputedStyle(document.documentElement).lineHeight),
        '%': value => value / 100 * (percentTarget == 'height' ? target.getBoundingClientRect().height : target.getBoundingClientRect().width),

        /* todo
        //find parent with computed style where container-type is inline-size or size (regarding to query type)
        //use this size for calculation
        'cqw':
        'cqh':
        'cqi':
        'cqb':
        'cqmin':
        'cqmax':
        */

        // Times
        'ms': value => value,
        's': value => value * 1000,

        // Angles
        'deg': value => value,
        'rad': value => value * (180 / Math.PI),
        'grad': value => value * (180 / 200),
        'turn': value => value * 360
    };

    // If is a match, return example: [ "-2.75rem", "-2.75", "rem" ]
    const matches = cssValue.trim().match(pattern);

    if (matches) {
        const value = Number(matches[1]);
        const unit = matches[2].toLowerCase();

        // Sanity check, make sure unit conversion function exists
        if (unit in supportedUnits) {
            return supportedUnits[unit](value);
        }
    }

    //@ts-ignore
    return cssValue;
}

export function getCssUnit(cssValue: string) {
    const matches = cssValue.trim().match(pattern);
    if (matches)
        return matches[2].toLowerCase();
    return null;
}

export function convertCssUnit(cssValue: string | number, target: HTMLElement, percentTarget: 'width' | 'height', unit: string) {

    if (!cssValue)
        return null;

    const supportedUnits = {

        // Absolute sizes
        'px': value => value,
        'cm': value => value / 38,
        'mm': value => value / 3.8,
        'q': value => value / 0.95,
        'in': value => value / 96,
        'pc': value => value / 16,
        'pt': value => value / 1.333333,

        // Relative sizes
        'rem': value => value / parseFloat(getComputedStyle(document.documentElement).fontSize),
        'em': value => value / parseFloat(getComputedStyle(target).fontSize),
        'vw': value => value * 100 / window.innerWidth,
        'vh': value => value * 100 / window.innerHeight,
        'vmin': value => value * 100 / (window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth),
        'vmax': value => value * 100 / (window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth),
        'lh': value => value / parseFloat(getComputedStyle(target).lineHeight),
        'rlh': value => value / parseFloat(getComputedStyle(document.documentElement).lineHeight),
        '%': value => value * 100 / (percentTarget == 'height' ? target.getBoundingClientRect().height : target.getBoundingClientRect().width),

        // Times
        'ms': value => value,
        's': value => value / 1000,

        // Angles
        'deg': value => value,
        'rad': value => value / (180 / Math.PI),
        'grad': value => value / (180 / 200),
        'turn': value => value / 360
    };

    if (typeof cssValue == 'string')
        cssValue = convertCssUnitToPixel(cssValue, target, percentTarget);
    if (unit in supportedUnits) {
        return supportedUnits[unit](cssValue) + unit;
    }

    return cssValue;
}