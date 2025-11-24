//todo:
//transform-box (SVGs)  https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box

/**
* @param {globalThis} windowObj?
*/
export function addPolyfill(windowObj = window) {
    if (!windowObj.Node.prototype.getBoxQuads) {
        //@ts-ignore
        windowObj.Node.prototype.getBoxQuads = function (options) {
            return getBoxQuads(this, options)
        }
    }

    if (!windowObj.Node.prototype.convertQuadFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertQuadFromNode = function (quad, from, options) {
            return convertQuadFromNode(this, quad, from, options)
        }
    }

    if (!windowObj.Node.prototype.convertRectFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertRectFromNode = function (rect, from, options) {
            return convertRectFromNode(this, rect, from, options)
        }
    }

    if (!windowObj.Node.prototype.convertPointFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertPointFromNode = function (point, from, options) {
            return convertPointFromNode(this, point, from, options)
        }
    }
}

/**
* @param {globalThis} windowObj?
*/
export function patchAdoptNode(windowObj = window) {
    if (!windowObj.Node.prototype.getBoxQuads) {
        //@ts-ignore
        windowObj.Node.prototype.getBoxQuads = function (options) {
            return getBoxQuads(this, options)
        }
    }

    if (!windowObj.Node.prototype.convertQuadFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertQuadFromNode = function (quad, from, options) {
            return convertQuadFromNode(this, quad, from, options)
        }
    }

    if (!windowObj.Node.prototype.convertRectFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertRectFromNode = function (rect, from, options) {
            return convertRectFromNode(this, rect, from, options)
        }
    }

    if (!windowObj.Node.prototype.convertPointFromNode) {
        //@ts-ignore
        windowObj.Node.prototype.convertPointFromNode = function (point, from, options) {
            return convertPointFromNode(this, point, from, options)
        }
    }
}

/**
* @param {Node} node
* @param {DOMQuadInit} quad
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content', iframes?: HTMLIFrameElement[]}=} options
* @returns {DOMQuad}
*/
export function convertQuadFromNode(node, quad, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, document.body, options?.iframes);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, document.body, options?.iframes).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        quad = new DOMQuad(transformPointBox(quad.p1, options.fromBox, getCachedComputedStyle(from), -1), transformPointBox(quad.p2, options.fromBox, getCachedComputedStyle(from), -1), transformPointBox(quad.p3, options.fromBox, getCachedComputedStyle(from), -1), transformPointBox(quad.p4, options.fromBox, getCachedComputedStyle(from), -1))
    }
    let res = new DOMQuad(m2.transformPoint(m1.transformPoint(quad.p1)), m2.transformPoint(m1.transformPoint(quad.p2)), m2.transformPoint(m1.transformPoint(quad.p3)), m2.transformPoint(m1.transformPoint(quad.p4)));
    if (options?.toBox && options?.toBox !== 'border' && (node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element)) {
        res = new DOMQuad(transformPointBox(res.p1, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p2, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p3, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p4, options.toBox, getCachedComputedStyle(node), -1))
    }
    return res;

}

/**
* @param {Node} node
* @param {{x: number, y: number, width: number, height: number}} rect
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content', iframes?: HTMLIFrameElement[]}=} options
* @returns {DOMQuad}
*/
export function convertRectFromNode(node, rect, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, (node.ownerDocument.defaultView ?? window).document.body.parentElement, options?.iframes);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, (node.ownerDocument.defaultView ?? window).document.body.parentElement, options?.iframes).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        const p = transformPointBox(new DOMPoint(rect.x, rect.y), options.fromBox, getCachedComputedStyle(from), 1);
        rect = new DOMRect(p.x, p.y, rect.width, rect.height);
    }
    let res = new DOMQuad(m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x, rect.y))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x + rect.width, rect.y))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x + rect.width, rect.y + rect.height))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x, rect.y + rect.height))));
    if (options?.toBox && options?.toBox !== 'border' && (node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element)) {
        res = new DOMQuad(transformPointBox(res.p1, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p2, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p3, options.toBox, getCachedComputedStyle(node), -1), transformPointBox(res.p4, options.toBox, getCachedComputedStyle(node), -1))
    }
    return res;
}

/**
* @param {Node} node
* @param {DOMPointInit} point
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content', iframes?: HTMLIFrameElement[]}=} options
* @returns {DOMPoint}
*/
export function convertPointFromNode(node, point, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, (node.ownerDocument.defaultView ?? window).document.body.parentElement, options?.iframes);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, document.body, options?.iframes).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        point = transformPointBox(point, options.fromBox, getCachedComputedStyle(from), 1);
    }
    let res = m2.transformPoint(m1.transformPoint(point));
    if (options?.toBox && options?.toBox !== 'border' && (node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element)) {
        res = transformPointBox(res, options.toBox, getCachedComputedStyle(node), -1);
    }
    return res;
}

/**
* @param {DOMPointInit} point
* @param {'margin'|'border'|'padding'|'content'} box
* @param {CSSStyleDeclaration} style
* @param {number} operator
* @returns {DOMPoint}
*/
function transformPointBox(point, box, style, operator) {
    if (box === 'margin') {
        return new DOMPoint(point.x - operator * parseFloat(style.marginLeft), point.y - operator * parseFloat(style.marginTop));
    } else if (box === 'padding') {
        return new DOMPoint(point.x + operator * parseFloat(style.borderLeftWidth), point.y + operator * parseFloat(style.borderTopWidth));
    } else if (box === 'content') {
        return new DOMPoint(point.x + operator * (parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)), point.y + operator * (parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop)));
    }
    //@ts-ignore
    return point;
}

/** @type { WeakMap<Node, number> } */
let hash;
/** @type { Map<string, DOMQuad[]> } */
let boxQuadsCache;
/** @type { Map<string, DOMMatrix> } */
let transformCache;
/** @type { WeakMap<Node, CSSStyleDeclaration> } */
let computedStyleCache;
let hashId = 0;

export function clearCache() {
    boxQuadsCache.clear();
    transformCache.clear();
    computedStyleCache = new WeakMap();
}

export function useCache() {
    hash = new WeakMap();
    boxQuadsCache = new Map();
    transformCache = new Map();
    computedStyleCache = new WeakMap();
}

/**
* @param {Element} element
* @returns {CSSStyleDeclaration}
*/
function getCachedComputedStyle(element) {
    if (!computedStyleCache) {
        return (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
    }
    let style = computedStyleCache.get(element);
    if (!style) {
        style = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
        computedStyleCache.set(element, style);
    }
    return style;
}

/**
* @param {Node} node
* @param {{box?: 'margin'|'border'|'padding'|'content', relativeTo?: Element, iframes?: HTMLIFrameElement[]}=} options
* @returns {DOMQuad[]}
*/
export function getBoxQuads(node, options) {
    let key;
    if (boxQuadsCache) {
        let i1 = hash.get(node);
        if (i1 === undefined)
            hash.set(node, i1 = hashId++);
        let i2 = hash.get(options?.relativeTo ?? document.body);
        if (i2 === undefined)
            hash.set(options?.relativeTo ?? document.body, i2 = hashId++);
        key = i1 + '_' + i2 + '_' + (options?.box ?? 'border');
        const q = boxQuadsCache.get(key);
        if (q)
            return q;
    }

    /** @type {DOMMatrix} */
    let originalElementAndAllParentsMultipliedMatrix = getResultingTransformationBetweenElementAndAllAncestors(node, options?.relativeTo ?? document.body, options?.iframes);
    let { width, height } = getElementSize(node, originalElementAndAllParentsMultipliedMatrix);

    let arr = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    /** @type { [DOMPoint, DOMPoint, DOMPoint, DOMPoint] } */
    //@ts-ignore
    const points = Array(4);

    /** @type {{x: number, y:number}[] } */
    let o = null;
    if ((node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element)) {
        if (options?.box === 'margin') {
            const cs = getCachedComputedStyle(node);
            o = [{ x: parseFloat(cs.marginLeft), y: parseFloat(cs.marginTop) }, { x: -parseFloat(cs.marginRight), y: parseFloat(cs.marginTop) }, { x: -parseFloat(cs.marginRight), y: -parseFloat(cs.marginBottom) }, { x: parseFloat(cs.marginLeft), y: -parseFloat(cs.marginBottom) }];
        } else if (options?.box === 'padding') {
            const cs = getCachedComputedStyle(node);
            o = [{ x: -parseFloat(cs.borderLeftWidth), y: -parseFloat(cs.borderTopWidth) }, { x: parseFloat(cs.borderRightWidth), y: -parseFloat(cs.borderTopWidth) }, { x: parseFloat(cs.borderRightWidth), y: parseFloat(cs.borderBottomWidth) }, { x: -parseFloat(cs.borderLeftWidth), y: parseFloat(cs.borderBottomWidth) }];
        } else if (options?.box === 'content') {
            const cs = getCachedComputedStyle(node);
            o = [{ x: -parseFloat(cs.borderLeftWidth) - parseFloat(cs.paddingLeft), y: -parseFloat(cs.borderTopWidth) - parseFloat(cs.paddingTop) }, { x: parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight), y: -parseFloat(cs.borderTopWidth) - parseFloat(cs.paddingTop) }, { x: parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight), y: parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom) }, { x: -parseFloat(cs.borderLeftWidth) - parseFloat(cs.paddingLeft), y: parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom) }];
        }
    }

    for (let i = 0; i < 4; i++) {
        /** @type { DOMPoint } */
        let p;
        if (!o)
            p = new DOMPoint(arr[i].x, arr[i].y);
        else
            p = new DOMPoint(arr[i].x - o[i].x, arr[i].y - o[i].y);

        points[i] = projectPoint(p, originalElementAndAllParentsMultipliedMatrix).matrixTransform(originalElementAndAllParentsMultipliedMatrix);
        points[i] = as2DPoint(points[i]);
    }

    const quad = [new DOMQuad(points[0], points[1], points[2], points[3])];
    if (boxQuadsCache)
        boxQuadsCache.set(key, quad);
    return quad;
}


//todo: https://drafts.csswg.org/css-transforms-2/#accumulated-3d-transformation-matrix-computation
// also good for writing a spec

// Find a value for z that will transform to 0. (from firefox matrix.h)
// or chromium https://github.com/chromium/chromium/blob/main/ui/gfx/geometry/transform.cc#L849
/**
* @param {DOMPoint} point
*/
function projectPoint(point, m) {
    const z = -(point.x * m.m13 + point.y * m.m23 + m.m43) / m.m33;
    return new DOMPoint(point.x, point.y, z, 1);
}

/**
* convert a DOM-Point to 2D 
* @param {DOMPoint} point
*/
function as2DPoint(point) {
    return new DOMPoint(
        point.x / point.w,
        point.y / point.w
    );
}

/**
* @param {Node} node
* @param {DOMMatrix=} matrix
*/
export function getElementSize(node, matrix) {
    let width = 0;
    let height = 0;
    if ((node instanceof HTMLElement || node instanceof (node.ownerDocument.defaultView ?? window).HTMLElement)) {
        width = node.offsetWidth;
        height = node.offsetHeight;
    } else if ((node instanceof SVGSVGElement || node instanceof (node.ownerDocument.defaultView ?? window).SVGSVGElement)) {
        width = node.width.baseVal.value
        height = node.height.baseVal.value
    } else if ((node instanceof SVGGraphicsElement || node instanceof (node.ownerDocument.defaultView ?? window).SVGGraphicsElement)) {
        const bbox = node.getBBox()
        width = bbox.width;
        height = bbox.height;
    } else if ((node instanceof MathMLElement || node instanceof (node.ownerDocument.defaultView ?? window).MathMLElement)) {
        const bbox = node.getBoundingClientRect()
        width = bbox.width / (matrix?.a ?? 1);
        height = bbox.height / (matrix?.d ?? 1);
    } else if ((node instanceof Text || node instanceof (node.ownerDocument.defaultView ?? window).Text)) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const targetRect = range.getBoundingClientRect();
        width = targetRect.width / (matrix?.a ?? 1);
        height = targetRect.height / (matrix?.d ?? 1);
    }
    return { width, height }
}

/**
* @param {Node} node
* @param {boolean} includeScroll
* @param {HTMLIFrameElement[]} iframes
*/
function getElementOffsetsInContainer(node, includeScroll, iframes) {
    if ((node instanceof HTMLElement || node instanceof (node.ownerDocument.defaultView ?? window).HTMLElement)) {
        let cs = getCachedComputedStyle(node);
        if (cs.offsetPath && cs.offsetPath !== 'none') {
            return new DOMPoint(0, 0);
        }
        if (includeScroll) {
            const cs = getCachedComputedStyle(node);
            return new DOMPoint(node.offsetLeft - (includeScroll ? node.scrollLeft - parseFloat(cs.borderLeftWidth) : 0), node.offsetTop - (includeScroll ? node.scrollTop - parseFloat(cs.borderTopWidth) : 0));
        } else {
            return new DOMPoint(node.offsetLeft, node.offsetTop);
        }
    } else if ((node instanceof Text || node instanceof (node.ownerDocument.defaultView ?? window).Text)) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const r1 = range.getBoundingClientRect();
        /** @type {HTMLElement} */
        //@ts-ignore
        const parent = getParentElementIncludingSlots(node, iframes);
        const r2 = parent.getBoundingClientRect();
        const zX = parent.offsetWidth / r2.width;
        const zY = parent.offsetHeight / r2.height;
        return new DOMPoint((r1.x - r2.x) * zX, (r1.y - r2.y) * zY);
    } else if ((node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element)) {
        if ((node instanceof SVGGraphicsElement || node instanceof (node.ownerDocument.defaultView ?? window).SVGGraphicsElement) && !((node instanceof SVGSVGElement || node instanceof (node.ownerDocument.defaultView ?? window).SVGSVGElement))) {
            const bb = node.getBBox();
            return new DOMPoint(bb.x, bb.y);
        }
        const cs = getCachedComputedStyle(node);
        if (cs.position === 'absolute') {
            return new DOMPoint(parseFloat(cs.left), parseFloat(cs.top));
        }

        const par = getParentElementIncludingSlots(node, iframes);
        const m = getResultingTransformationBetweenElementAndAllAncestors(par, document.body, iframes).inverse();
        const r1 = node.getBoundingClientRect();
        const r1t = m.transformPoint(r1);
        const r2 = par.getBoundingClientRect();
        const r2t = m.transformPoint(r2);

        return new DOMPoint(r1t.x - r2t.x, r1t.y - r2t.y);
    }
}

/**
* @param {Node} node
* @param {Element} ancestor
* @param {HTMLIFrameElement[]} iframes
*/
export function getResultingTransformationBetweenElementAndAllAncestors(node, ancestor, iframes) {
    let key;
    if (transformCache) {
        let i1 = hash.get(node);
        if (i1 === undefined)
            hash.set(node, i1 = hashId++);
        let i2 = hash.get(ancestor);
        if (i2 === undefined)
            hash.set(ancestor, i2 = hashId++);
        key = i1 + '_' + i2;
        const q = transformCache.get(key);
        if (q)
            return q;
    }

    /** @type {Element } */
    //@ts-ignore
    let actualElement = node;
    /** @type {DOMMatrix } */
    let parentElementMatrix;
    /** @type {DOMMatrix } */
    let originalElementAndAllParentsMultipliedMatrix = getElementCombinedTransform(actualElement, iframes);
    let perspectiveParentElement = getParentElementIncludingSlots(actualElement, iframes);
    if (perspectiveParentElement) {
        let s = getCachedComputedStyle(perspectiveParentElement);
        if (s.transformStyle !== 'preserve-3d') {
            projectTo2D(originalElementAndAllParentsMultipliedMatrix);
        }
    }
    let lastOffsetParent = null;
    while (actualElement != ancestor && actualElement != null) {
        const parentElement = getParentElementIncludingSlots(actualElement, iframes);

        if (actualElement.assignedSlot != null) {
            const l = offsetTopLeftPolyfill(actualElement, 'offsetLeft');
            const t = offsetTopLeftPolyfill(actualElement, 'offsetTop');
            const mvMat = new DOMMatrix().translateSelf(l, t);
            originalElementAndAllParentsMultipliedMatrix = mvMat.multiplySelf(originalElementAndAllParentsMultipliedMatrix);
        } else {
            if ((actualElement instanceof HTMLElement || actualElement instanceof (actualElement.ownerDocument.defaultView ?? window).HTMLElement)) {
                if (lastOffsetParent !== actualElement.offsetParent && !((actualElement instanceof HTMLSlotElement || actualElement instanceof (actualElement.ownerDocument.defaultView ?? window).HTMLSlotElement))) {
                    const offsets = getElementOffsetsInContainer(actualElement, actualElement !== node, iframes);
                    lastOffsetParent = actualElement.offsetParent;
                    const mvMat = new DOMMatrix().translateSelf(offsets.x, offsets.y);
                    originalElementAndAllParentsMultipliedMatrix = mvMat.multiplySelf(originalElementAndAllParentsMultipliedMatrix);
                }
            } else {
                const offsets = getElementOffsetsInContainer(actualElement, actualElement !== node, iframes);
                lastOffsetParent = null;
                const mvMat = new DOMMatrix().translateSelf(offsets.x, offsets.y);
                originalElementAndAllParentsMultipliedMatrix = mvMat.multiplySelf(originalElementAndAllParentsMultipliedMatrix);
            }
        }

        if (parentElement) {
            parentElementMatrix = getElementCombinedTransform(parentElement, iframes);

            if (parentElement != ancestor)
                originalElementAndAllParentsMultipliedMatrix = parentElementMatrix.multiply(originalElementAndAllParentsMultipliedMatrix);

            perspectiveParentElement = getParentElementIncludingSlots(parentElement, iframes);
            if (perspectiveParentElement) {
                const s = getCachedComputedStyle(perspectiveParentElement);
                if (s.transformStyle !== 'preserve-3d') {
                    projectTo2D(originalElementAndAllParentsMultipliedMatrix);
                }
            }

            if (parentElement === ancestor) {
                if (parentElement.scrollTop || parentElement.scrollLeft)
                    originalElementAndAllParentsMultipliedMatrix = new DOMMatrix().translate(-parentElement.scrollLeft, -parentElement.scrollTop).multiply(originalElementAndAllParentsMultipliedMatrix);
                return originalElementAndAllParentsMultipliedMatrix;
            }
        }
        actualElement = parentElement;
    }

    if (transformCache) {
        transformCache.set(key, originalElementAndAllParentsMultipliedMatrix);
    }
    return originalElementAndAllParentsMultipliedMatrix;
}

/**
* @param {Node} node
* @param {HTMLIFrameElement[]} iframes
* @returns {Element}
*/
function getParentElementIncludingSlots(node, iframes) {
    if ((node instanceof Element || node instanceof (node.ownerDocument.defaultView ?? window).Element) && node.assignedSlot)
        return node.assignedSlot;
    if (node.parentElement == null) {
        if ((node.parentNode instanceof ShadowRoot || node.parentNode instanceof (node.ownerDocument.defaultView ?? window).ShadowRoot)) {
            return node.parentNode.host;
        }
    }
    if ((node instanceof HTMLHtmlElement || node instanceof (node.ownerDocument.defaultView ?? window).HTMLHtmlElement)) {
        if (iframes) {
            for (const f of iframes)
                if (f?.contentDocument == node.ownerDocument)
                    return f;
        }
    }
    return node.parentElement;
}

/**
* @param {Element} element
* @param {HTMLIFrameElement[]=} iframes
*/
export function getElementCombinedTransform(element, iframes) {
    if ((element instanceof Text || element instanceof (element.ownerDocument.defaultView ?? window).Text))
        return new DOMMatrix;

    //https://www.w3.org/TR/css-transforms-2/#ctm
    let s = getCachedComputedStyle(element);

    let m = new DOMMatrix();
    const origin = s.transformOrigin.split(' ');
    const originX = parseFloat(origin[0]);
    const originY = parseFloat(origin[1]);
    const originZ = origin[2] ? parseFloat(origin[2]) : 0;

    const mOri = new DOMMatrix().translate(originX, originY, originZ);

    if (s.translate != 'none' && s.translate) {
        let tr = s.translate;
        if (tr.includes('%')) {
            const v = tr.split(' ');
            const r = element.getBoundingClientRect();
            if (v[0].endsWith('%'))
                v[0] = (parseFloat(v[0]) * r.width / 100) + 'px';
            if (v[1]?.endsWith('%'))
                v[1] = (parseFloat(v[1]) * r.height / 100) + 'px';
            tr = v.join(',');
        }
        m.multiplySelf(new DOMMatrix('translate(' + tr.replaceAll(' ', ',') + ')'));
    }
    if (s.rotate != 'none' && s.rotate) {
        m.multiplySelf(new DOMMatrix('rotate(' + s.rotate.replaceAll(' ', ',') + ')'));
    }
    if (s.scale != 'none' && s.scale) {
        m.multiplySelf(new DOMMatrix('scale(' + s.scale.replaceAll(' ', ',') + ')'));
    }
    if (s.transform != 'none' && s.transform) {
        m.multiplySelf(new DOMMatrix(s.transform));
    }

    m = mOri.multiply(m.multiply(mOri.inverse()));

    if (s.offsetPath && s.offsetPath !== 'none') {
        m.multiplySelf(computeOffsetTransformMatrix(element));
    }

    //@ts-ignore
    const pt = getElementPerspectiveTransform(element, iframes);
    if (pt != null) {
        m = pt.multiply(m);
    }
    return m;
}

/**
* project a DOM-Matrix to 2D (from firefox matrix.h)
* @param {DOMMatrix} m
*/
function projectTo2D(m) {
    m.m31 = 0.0;
    m.m32 = 0.0;
    m.m13 = 0.0;
    m.m23 = 0.0;
    m.m33 = 1.0;
    m.m43 = 0.0;
    m.m34 = 0.0;
    // Some matrices, such as those derived from perspective transforms,
    // can modify _44 from 1, while leaving the rest of the fourth column
    // (_14, _24) at 0. In this case, after resetting the third row and
    // third column above, the value of _44 functions only to scale the
    // coordinate transform divide by W. The matrix can be converted to
    // a true 2D matrix by normalizing out the scaling effect of _44 on
    // the remaining components ahead of time.
    if (m.m14 == 0.0 && m.m24 == 0.0 && m.m44 != 1.0 && m.m44 != 0.0) {
        const scale = 1.0 / m.m44;
        m.m11 *= scale;
        m.m12 *= scale;
        m.m21 *= scale;
        m.m22 *= scale;
        m.m41 *= scale;
        m.m42 *= scale;
        m.m44 = 1.0;
    }
}

/**
* @param {HTMLElement} element
* @param {HTMLIFrameElement[]} iframes
*/
function getElementPerspectiveTransform(element, iframes) {
    /** @type { Element } */
    //@ts-ignore
    const perspectiveNode = getParentElementIncludingSlots(element, iframes);
    if (perspectiveNode) {
        //https://drafts.csswg.org/css-transforms-2/#perspective-matrix-computation
        let s = getCachedComputedStyle(perspectiveNode);
        if (s.perspective !== 'none') {
            let m = new DOMMatrix();
            let p = parseFloat(s.perspective);
            m.m34 = -1.0 / p;
            //https://drafts.csswg.org/css-transforms-2/#PerspectiveDefined
            if (s.perspectiveOrigin) {
                const origin = s.perspectiveOrigin.split(' ');
                const originX = parseFloat(origin[0]) - element.offsetLeft;
                const originY = parseFloat(origin[1]) - element.offsetTop;

                const mOri = new DOMMatrix().translate(originX, originY);
                const mOriInv = new DOMMatrix().translate(-originX, -originY);

                return mOri.multiply(m.multiply(mOriInv));
            }
        }
    }
    return null;
}

function computeOffsetTransformMatrix(elem) {
    const cs = getCachedComputedStyle(elem);

    const offsetPath = cs.offsetPath;          // e.g. "path('M0,0 ...')"
    const offsetDistance = cs.offsetDistance;  // e.g. "50%"
    const offsetRotate = cs.offsetRotate;      // e.g. "auto", "45deg", "auto 30deg"
    const offsetAnchor = cs.offsetAnchor;
    const transformOrigin = cs.transformOrigin;

    // Parse offset-distance (px or %)
    let distance = parseOffsetDistance(offsetDistance);

    // Compute position & tangent on path
    let { x, y, angle } = computeOffsetPathPoint(elem, offsetPath, distance);

    // Handle offset-rotate
    let rotateFinal = 0;
    if (offsetRotate.startsWith("auto")) {
        let parts = offsetRotate.split(/\s+/);
        let extra = parts.length === 2 ? parseFloat(parts[1]) : 0;
        rotateFinal = angle + extra;
    } else {
        rotateFinal = parseFloat(offsetRotate);
    }

    const anchor = parseOffsetAnchor(offsetAnchor, transformOrigin, elem);

    const anchorMatrix = new DOMMatrix().translateSelf(-anchor.x, -anchor.y);

    let m = anchorMatrix.translate(x, y);
    m.multiplySelf(anchorMatrix.invertSelf());
    m.rotateSelf(rotateFinal);
    m.translateSelf(-anchor.x, -anchor.y);

    return m;
}

function parseOffsetAnchor(str, transformOrigin, elem) {
    const width = elem.offsetWidth;
    const height = elem.offsetHeight;

    if (!str || str === "auto") {
        str = transformOrigin;
    }

    const parts = str.split(/\s+/);
    if (parts.length === 1) {
        // 1-value syntax = x only, y = center
        const x = parsePosition(parts[0], width);
        return { x, y: height / 2 };
    }

    const x = parsePosition(parts[0], width);
    const y = parsePosition(parts[1], height);
    return { x, y };
}

function parsePosition(part, size) {
    part = part.trim();
    if (part.endsWith("%")) {
        return parseFloat(part) / 100 * size;
    }
    if (part.endsWith("px")) {
        return parseFloat(part);
    }
    // keywords
    switch (part) {
        case "left": return 0;
        case "top": return 0;
        case "center": return size / 2;
        case "right": return size;
        case "bottom": return size;
    }
    return parseFloat(part);
}

function parseOffsetDistance(str) {
    str = str.trim();
    if (str.endsWith("%")) {
        return parseFloat(str) / 100; // normalized (0..1)
    }
    return parseFloat(str); // px value if pathLength = 1
}

function parseAngle(str) {
    if (!str) return 0;
    str = str.trim();
    if (str.endsWith("deg")) return parseFloat(str);
    if (str.endsWith("rad")) return parseFloat(str) * (180 / Math.PI);
    if (str.endsWith("grad")) return parseFloat(str) * 0.9;
    return parseFloat(str);
}

function computeOffsetPathPoint(elem, offsetPath, distNorm) {
    if (!offsetPath || offsetPath === "none") {
        return { x: 0, y: 0, angle: 0 };
    }

    const value = offsetPath.trim();

    let m = value.match(/path\(["'](.+)["']\)/);
    if (m) return computePathType(m[1], distNorm);

    if (value.startsWith("circle("))
        return computeCircle(value, distNorm);
    if (value.startsWith("ellipse("))
        return computeEllipse(value, distNorm);
    if (value.startsWith("inset("))
        return computeInset(value, distNorm);
    if (value.startsWith("rect("))
        return computeRect(value, distNorm);
    if (value.startsWith("xywh("))
        return computeXYWH(value, distNorm);
    if (value.startsWith("ray("))
        return computeRay(value, distNorm);
    if (value.startsWith("polygon("))
        return computePolygon(value, distNorm);

    console.warn("Unsupported offset-path:", offsetPath);
    return { x: 0, y: 0, angle: 0 };
}


function computePathType(pathData, distNorm) {
    let svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgPath.setAttribute("d", pathData);

    const total = svgPath.getTotalLength();
    const dist = distNorm <= 1 ? distNorm * total : distNorm;

    const p1 = svgPath.getPointAtLength(dist);
    const p2 = svgPath.getPointAtLength(Math.min(total, dist + 0.01));

    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

    return { x: p1.x, y: p1.y, angle };
}

function computeRay(str, t) {
    let m = str.match(/ray\(([^)]+)\)/);
    let inside = m[1].trim();

    // Split on "at" (optional)
    let [beforeAt, atPart] = inside.split("at").map(s => s && s.trim());

    // angle
    let parts = beforeAt.split(/\s+/);
    let angleDeg = parseAngle(parts[0]);
    let angleRad = angleDeg * Math.PI / 180;

    // point of origin
    let ox = 0, oy = 0;
    if (atPart) {
        const pos = atPart.split(/\s+/);
        ox = parseFloat(pos[0]);
        oy = parseFloat(pos[1]);
    }

    // Ray: infinite line; offset-distance is distance along ray
    let dist = (t <= 1 ? t : t); // percentage normalized already

    let x = ox + Math.cos(angleRad) * dist;
    let y = oy + Math.sin(angleRad) * dist;

    // tangent is ray direction
    return { x, y, angle: angleDeg };
}

function computeCircle(str, t) {
    let m = str.match(/circle\(([^)]+)\)/);
    let inner = m[1];

    let [radiusPart, atPart] = inner.split("at").map(s => s.trim());
    let r = parseFloat(radiusPart);
    let [cx, cy] = atPart.split(/\s+/).map(parseFloat);

    let angleRad = t * 2 * Math.PI;
    let x = cx + Math.cos(angleRad) * r;
    let y = cy + Math.sin(angleRad) * r;

    let tangentAngleDeg = angleRad * 180 / Math.PI + 90;

    return { x, y, angle: tangentAngleDeg };
}

function computeEllipse(str, t) {
    let m = str.match(/ellipse\(([^)]+)\)/);
    let parts = m[1].split("at");
    let radii = parts[0].trim().split(/\s+/).map(parseFloat);
    let center = parts[1].trim().split(/\s+/).map(parseFloat);

    let rx = radii[0];
    let ry = radii[1];
    let cx = center[0];
    let cy = center[1];

    let angleRad = t * 2 * Math.PI;

    let x = cx + Math.cos(angleRad) * rx;
    let y = cy + Math.sin(angleRad) * ry;

    // tangent direction derivative
    let dx = -Math.sin(angleRad) * rx;
    let dy = Math.cos(angleRad) * ry;
    let tangentAngleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

    return { x, y, angle: tangentAngleDeg };
}

function computeInset(str, t) {
    let m = str.match(/inset\(([^)]+)\)/);
    let nums = m[1].split(/\s+/).map(s => parseFloat(s));
    let top = nums[0], right = nums[1], bottom = nums[2], left = nums[3];
    return rectPath(top, left, right, bottom, t);
}

function computeRect(str, t) {
    let m = str.match(/rect\(([^)]+)\)/);
    let nums = m[1].split(/\s+/).map(s => parseFloat(s));
    let top = nums[0], right = nums[1], bottom = nums[2], left = nums[3];
    return rectPath(top, left, right, bottom, t);
}

function computeXYWH(str, t) {
    let m = str.match(/xywh\(([^)]+)\)/);
    let nums = m[1].split(/\s+/).map(parseFloat);

    let left = nums[0];
    let top = nums[1];
    let width = nums[2];
    let height = nums[3];

    return rectPath(top, left, left + width, top + height, t);
}

function computePolygon(str, t) {
    let m = str.match(/polygon\(([^)]+)\)/);
    let pairs = m[1].split(",").map(p => p.trim().split(/\s+/).map(parseFloat));

    // Build cumulative lengths
    let pts = pairs;
    let lengths = [0];

    for (let i = 1; i < pts.length; i++) {
        let dx = pts[i][0] - pts[i - 1][0];
        let dy = pts[i][1] - pts[i - 1][1];
        lengths.push(Math.hypot(dx, dy) + lengths[i - 1]);
    }

    // close polygon
    let dx = pts[0][0] - pts[pts.length - 1][0];
    let dy = pts[0][1] - pts[pts.length - 1][1];
    lengths.push(Math.hypot(dx, dy) + lengths[lengths.length - 1]);

    let total = lengths[lengths.length - 1];
    let target = t * total;

    // find segment
    let i = lengths.findIndex(len => len >= target);
    if (i <= 0) i = 1;

    let prevLen = lengths[i - 1];
    let nextLen = lengths[i];
    let segT = (target - prevLen) / (nextLen - prevLen);

    // segment points
    let a = pts[(i - 1) % pts.length];
    let b = pts[i % pts.length];

    let x = a[0] + (b[0] - a[0]) * segT;
    let y = a[1] + (b[1] - a[1]) * segT;

    let angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;

    return { x, y, angle };
}

function rectPath(top, left, right, bottom, t) {
    let w = right - left;
    let h = bottom - top;

    let perimeter = 2 * (w + h);
    let dist = t * perimeter;

    // go around edges
    if (dist < w) {
        // top edge
        let x = left + dist;
        return { x, y: top, angle: 0 };
    }
    dist -= w;

    if (dist < h) {
        // right edge
        let y = top + dist;
        return { x: right, y, angle: 90 };
    }
    dist -= h;

    if (dist < w) {
        // bottom edge
        let x = right - dist;
        return { x, y: bottom, angle: 180 };
    }
    dist -= w;

    // left edge
    let y = bottom - dist;
    return { x: left, y, angle: 270 };
}

//Code from: https://github.com/floating-ui/floating-ui/blob/master/packages/utils/src/dom.ts

const transformProperties = ['transform', 'translate', 'scale', 'rotate', 'perspective'];
const willChangeValues = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'];
const containValues = ['paint', 'layout', 'strict', 'content'];

function isElement(value) {
    return value instanceof Element || value instanceof value?.ownerDocument?.defaultView?.Element;
}

/**
 * 
 * @param {Element | CSSStyleDeclaration} elementOrCss 
 * @returns {boolean}
 */
function isContainingBlock(elementOrCss) {
    /** @type {CSSStyleDeclaration } */
    //@ts-ignore
    const css = isElement(elementOrCss) ? getComputedStyle(elementOrCss) : elementOrCss;

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    // https://drafts.csswg.org/css-transforms-2/#individual-transforms
    return (
        transformProperties.some((value) => css[value] ? css[value] !== 'none' : false) ||
        (css.containerType ? css.containerType !== 'normal' : false) ||
        (css.backdropFilter ? css.backdropFilter !== 'none' : false) ||
        (css.filter ? css.filter !== 'none' : false) ||
        willChangeValues.some((value) => (css.willChange || '').includes(value)) ||
        containValues.some((value) => (css.contain || '').includes(value))
    );
}

//Code from: https://github.com/jcfranco/composed-offset-position/blob/main/src/index.ts
function flatTreeParent(element) {
    if (element.assignedSlot)
        return element.assignedSlot;
    if (element.parentNode instanceof ShadowRoot)
        return element.parentNode.host;
    return element.parentNode;
}

function ancestorTreeScopes(element) {
    const scopes = new Set();
    let currentScope = element.getRootNode();
    while (currentScope) {
        scopes.add(currentScope);
        currentScope = currentScope.parentNode
            ? currentScope.parentNode.getRootNode()
            : null;
    }

    return scopes;
}

function offsetParentPolyfill(element) {
    // Do an initial walk to check for display:none ancestors.
    for (let ancestor = element; ancestor; ancestor = flatTreeParent(ancestor)) {
        if (!(ancestor instanceof Element))
            continue;
        if (getCachedComputedStyle(ancestor).display === 'none')
            return null;
    }

    for (let ancestor = flatTreeParent(element); ancestor; ancestor = flatTreeParent(ancestor)) {
        if (!(ancestor instanceof Element))
            continue;
        const style = getCachedComputedStyle(ancestor);
        if (style.display === 'contents')
            continue;
        if (style.position !== 'static' || isContainingBlock(style))
            return ancestor;
        if (ancestor.tagName === 'BODY')
            return ancestor;
    }
    return null;
}

/**
 * 
 * @param {*} element 
 * @param {'offsetTop' | 'offsetLeft'} offsetTopOrLeft 
 * @returns 
 */
function offsetTopLeftPolyfill(element, offsetTopOrLeft) {
    let value = element[offsetTopOrLeft];
    let nextOffsetParent = offsetParentPolyfill(element);
    const scopes = ancestorTreeScopes(element);

    while (nextOffsetParent && !scopes.has(nextOffsetParent.getRootNode())) {
        value -= nextOffsetParent[offsetTopOrLeft];
        nextOffsetParent = offsetParentPolyfill(nextOffsetParent);
    }

    return value;
}