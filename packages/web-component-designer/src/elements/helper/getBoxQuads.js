//todo:
//transform-box  https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box

export function addPolyfill() {
    if (!Node.prototype.getBoxQuads) {
        //@ts-ignore
        Node.prototype.getBoxQuads = function (options) {
            return getBoxQuads(this, options)
        }
    }

    if (!Node.prototype.convertQuadFromNode) {
        //@ts-ignore
        Node.prototype.convertQuadFromNode = function (quad, from, options) {
            return convertQuadFromNode(this, quad, from, options)
        }
    }

    if (!Node.prototype.convertRectFromNode) {
        //@ts-ignore
        Node.prototype.convertRectFromNode = function (rect, from, options) {
            return convertRectFromNode(this, rect, from, options)
        }
    }

    if (!Node.prototype.convertPointFromNode) {
        //@ts-ignore
        Node.prototype.convertPointFromNode = function (point, from, options) {
            return convertPointFromNode(this, point, from, options)
        }
    }
}

/**
* @param {Node} node
* @param {DOMQuadInit} quad
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content'}=} options
* @returns {DOMQuad}
*/
export function convertQuadFromNode(node, quad, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, document.body);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, document.body).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        quad = new DOMQuad(transformPointBox(quad.p1, options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), -1), transformPointBox(quad.p2, options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), -1), transformPointBox(quad.p3, options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), -1), transformPointBox(quad.p4, options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), -1))
    }
    let res = new DOMQuad(m2.transformPoint(m1.transformPoint(quad.p1)), m2.transformPoint(m1.transformPoint(quad.p2)), m2.transformPoint(m1.transformPoint(quad.p3)), m2.transformPoint(m1.transformPoint(quad.p4)));
    if (options?.toBox && options?.toBox !== 'border' && node instanceof (node.ownerDocument.defaultView ?? window).Element) {
        res = new DOMQuad(transformPointBox(res.p1, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p2, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p3, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p4, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1))
    }
    return res;

}

/**
* @param {Node} node
* @param {DOMRectReadOnly} rect
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content'}=} options
* @returns {DOMQuad}
*/
export function convertRectFromNode(node, rect, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, document.body);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, document.body).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        const p = transformPointBox(new DOMPoint(rect.x, rect.y), options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), 1);
        rect = new DOMRect(p.x, p.y, rect.width, rect.height);
    }
    let res = new DOMQuad(m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x, rect.y))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x + rect.width, rect.y))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x + rect.width, rect.y + rect.height))), m2.transformPoint(m1.transformPoint(new DOMPoint(rect.x, rect.y + rect.height))));
    if (options?.toBox && options?.toBox !== 'border' && node instanceof (node.ownerDocument.defaultView ?? window).Element) {
        res = new DOMQuad(transformPointBox(res.p1, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p2, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p3, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1), transformPointBox(res.p4, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1))
    }
    return res;
}

/**
* @param {Node} node
* @param {DOMPointInit} point
* @param {Element} from
* @param {{fromBox?: 'margin'|'border'|'padding'|'content', toBox?: 'margin'|'border'|'padding'|'content'}=} options
* @returns {DOMPoint}
*/
export function convertPointFromNode(node, point, from, options) {
    const m1 = getResultingTransformationBetweenElementAndAllAncestors(from, document.body);
    const m2 = getResultingTransformationBetweenElementAndAllAncestors(node, document.body).inverse();
    if (options?.fromBox && options?.fromBox !== 'border') {
        point = transformPointBox(point, options.fromBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(from), 1);
    }
    let res = m2.transformPoint(m1.transformPoint(point));
    if (options?.toBox && options?.toBox !== 'border' && node instanceof (node.ownerDocument.defaultView ?? window).Element) {
        res = transformPointBox(res, options.toBox, (node.ownerDocument.defaultView ?? window).getComputedStyle(node), -1);
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

/**
* @param {Node} node
* @param {{box?: 'margin'|'border'|'padding'|'content', relativeTo?: Element, offset?: DOMQuad}=} options
* @returns {DOMQuad[]}
*/
export function getBoxQuads(node, options) {
    let { width, height } = getElementSize(node);
    /** @type {DOMMatrix} */
    let originalElementAndAllParentsMultipliedMatrix = getResultingTransformationBetweenElementAndAllAncestors(node, options?.relativeTo ?? document.body);

    let arr = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    /** @type { [DOMPoint, DOMPoint, DOMPoint, DOMPoint] } */
    //@ts-ignore
    const points = Array(4);

    /** @type {{x: number, y:number}[] } */
    let o = null;
    if (node instanceof (node.ownerDocument.defaultView ?? window).Element) {
        if (options?.box === 'margin') {
            const cs = (node.ownerDocument.defaultView ?? window).getComputedStyle(node);
            o = [{ x: parseFloat(cs.marginLeft), y: parseFloat(cs.marginTop) }, { x: -parseFloat(cs.marginRight), y: parseFloat(cs.marginTop) }, { x: -parseFloat(cs.marginRight), y: -parseFloat(cs.marginBottom) }, { x: parseFloat(cs.marginLeft), y: -parseFloat(cs.marginBottom) }];
        } else if (options?.box === 'padding') {
            const cs = (node.ownerDocument.defaultView ?? window).getComputedStyle(node);
            o = [{ x: -parseFloat(cs.borderLeftWidth), y: -parseFloat(cs.borderTopWidth) }, { x: parseFloat(cs.borderRightWidth), y: -parseFloat(cs.borderTopWidth) }, { x: parseFloat(cs.borderRightWidth), y: parseFloat(cs.borderBottomWidth) }, { x: -parseFloat(cs.borderLeftWidth), y: parseFloat(cs.borderBottomWidth) }];
        } else if (options?.box === 'content') {
            const cs = (node.ownerDocument.defaultView ?? window).getComputedStyle(node);
            o = [{ x: -parseFloat(cs.borderLeftWidth) - parseFloat(cs.paddingLeft), y: -parseFloat(cs.borderTopWidth) - parseFloat(cs.paddingTop) }, { x: parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight), y: -parseFloat(cs.borderTopWidth) - parseFloat(cs.paddingTop) }, { x: parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight), y: parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom) }, { x: -parseFloat(cs.borderLeftWidth) - parseFloat(cs.paddingLeft), y: parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom) }];
        }
    }
    if (options?.offset) {
        if (!o)
            o = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
        o[0].x = o[0].x + options.offset.p1.x;
        o[0].y = o[0].y + options.offset.p1.y;
        o[1].x = o[1].x + options.offset.p2.x;
        o[1].y = o[1].y + options.offset.p2.y;
        o[2].x = o[2].x + options.offset.p3.x;
        o[2].y = o[2].y + options.offset.p3.y;
        o[3].x = o[3].x + options.offset.p4.x;
        o[3].y = o[3].y + options.offset.p4.y;
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

    return [new DOMQuad(points[0], points[1], points[2], points[3])];
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
*/
export function getElementSize(node) {
    let width = 0;
    let height = 0;
    if (node instanceof (node.ownerDocument.defaultView ?? window).HTMLElement) {
        width = node.offsetWidth;
        height = node.offsetHeight;
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).SVGSVGElement) {
        width = node.width.baseVal.value
        height = node.height.baseVal.value
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).SVGGraphicsElement) {
        let bbox = node.getBBox()
        width = bbox.width;
        height = bbox.height;
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).MathMLElement) {
        let bbox = node.getBoundingClientRect()
        width = bbox.width;
        height = bbox.height;
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).Text) {
        let range = document.createRange();
        range.selectNodeContents(node);
        let targetRect = range.getBoundingClientRect();
        width = targetRect.width;
        height = targetRect.height;
    }
    return { width, height }
}

/**
* @param {Node} node
*/
function getElementOffsetsInContainer(node) {
    if (node instanceof (node.ownerDocument.defaultView ?? window).HTMLElement) {
        return new DOMPoint(node.offsetLeft - node.scrollLeft, node.offsetTop - node.scrollTop);
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).Text) {
        let range = document.createRange();
        range.selectNodeContents(node);
        let r1 = range.getBoundingClientRect();
        const r2 = getParentElementIncludingSlots(node).getBoundingClientRect();
        return new DOMPoint(r1.x - r2.x, r1.y - r2.y);
    } else if (node instanceof (node.ownerDocument.defaultView ?? window).Element) {
        if (node instanceof (node.ownerDocument.defaultView ?? window).SVGGraphicsElement && !(node instanceof (node.ownerDocument.defaultView ?? window).SVGSVGElement)) {
            const bb = node.getBBox();
            return new DOMPoint(bb.x, bb.y);
        }
        const cs = (node.ownerDocument.defaultView ?? window).getComputedStyle(node);
        if (cs.position === 'absolute') {
            return new DOMPoint(parseFloat(cs.left), parseFloat(cs.top));
        }
        
        const m = getResultingTransformationBetweenElementAndAllAncestors(node.parentNode, document.body);
        const r1 = node.getBoundingClientRect();
        const r1t = m.inverse().transformPoint(r1);
        const r2 = getParentElementIncludingSlots(node).getBoundingClientRect();
        const r2t = m.inverse().transformPoint(r2);

        return new DOMPoint(r1t.x - r2t.x, r1t.y - r2t.y);
    }
}

/**
* @param {Node} node
* @param {Element} ancestor
*/
export function getResultingTransformationBetweenElementAndAllAncestors(node, ancestor) {
    /** @type {Element } */
    //@ts-ignore
    let actualElement = node;
    /** @type {DOMMatrix } */
    let parentElementMatrix;
    /** @type {DOMMatrix } */
    let originalElementAndAllParentsMultipliedMatrix = getElementCombinedTransform(actualElement);
    let perspectiveParentElement = getParentElementIncludingSlots(actualElement);
    if (perspectiveParentElement) {
        let s = (actualElement.ownerDocument.defaultView ?? window).getComputedStyle(perspectiveParentElement);
        if (s.transformStyle !== 'preserve-3d') {
            projectTo2D(originalElementAndAllParentsMultipliedMatrix);
        }
    }
    let lastOffsetParent = null;
    while (actualElement != ancestor && actualElement != null) {
        if (actualElement instanceof (actualElement.ownerDocument.defaultView ?? window).HTMLElement) {
            if (lastOffsetParent !== actualElement.offsetParent && !(actualElement instanceof (actualElement.ownerDocument.defaultView ?? window).HTMLSlotElement)) {
                const offsets = getElementOffsetsInContainer(actualElement);
                lastOffsetParent = actualElement.offsetParent;
                const mvMat = new DOMMatrix().translate(offsets.x, offsets.y);
                originalElementAndAllParentsMultipliedMatrix = mvMat.multiply(originalElementAndAllParentsMultipliedMatrix);
            }
        } else {
            const offsets = getElementOffsetsInContainer(actualElement);
            lastOffsetParent = null;
            const mvMat = new DOMMatrix().translate(offsets.x, offsets.y);
            originalElementAndAllParentsMultipliedMatrix = mvMat.multiply(originalElementAndAllParentsMultipliedMatrix);
        }
        const parentElement = getParentElementIncludingSlots(actualElement);
        if (parentElement) {
            parentElementMatrix = getElementCombinedTransform(parentElement);

            if (parentElement != ancestor)
                originalElementAndAllParentsMultipliedMatrix = parentElementMatrix.multiply(originalElementAndAllParentsMultipliedMatrix);

            perspectiveParentElement = getParentElementIncludingSlots(parentElement);
            if (perspectiveParentElement) {
                const s = (perspectiveParentElement.ownerDocument.defaultView ?? window).getComputedStyle(perspectiveParentElement);
                if (s.transformStyle !== 'preserve-3d') {
                    projectTo2D(originalElementAndAllParentsMultipliedMatrix);
                }
            }

            if (parentElement === ancestor)
                return originalElementAndAllParentsMultipliedMatrix;
        }
        actualElement = parentElement;
    }

    return originalElementAndAllParentsMultipliedMatrix;
}

/**
* @param {Node} node
* @returns {Element}
*/
function getParentElementIncludingSlots(node) {
    if (node instanceof (node.ownerDocument.defaultView ?? window).Element && node.assignedSlot)
        return node.assignedSlot;
    if (node.parentElement == null) {
        if (node.parentNode instanceof (node.ownerDocument.defaultView ?? window).ShadowRoot) {
            return node.parentNode.host;
        }
    }
    return node.parentElement;
}

/**
* @param {Element} element
*/
export function getElementCombinedTransform(element) {
    if (element instanceof (element.ownerDocument.defaultView ?? window).Text)
        return new DOMMatrix;

    //https://www.w3.org/TR/css-transforms-2/#ctm
    let s = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);

    let m = new DOMMatrix();
    const origin = s.transformOrigin.split(' ');
    const originX = parseFloat(origin[0]);
    const originY = parseFloat(origin[1]);
    const originZ = origin[2] ? parseFloat(origin[2]) : 0;

    const mOri = new DOMMatrix().translate(originX, originY, originZ);

    if (s.translate != 'none' && s.translate) {
        m = m.multiply(new DOMMatrix('translate(' + s.translate.replace(' ', ',') + ')'));
    }
    if (s.rotate != 'none' && s.rotate) {
        m = m.multiply(new DOMMatrix('rotate(' + s.rotate.replace(' ', ',') + ')'));
    }
    if (s.scale != 'none' && s.scale) {
        m = m.multiply(new DOMMatrix('scale(' + s.scale.replace(' ', ',') + ')'));
    }
    if (s.transform != 'none' && s.transform) {
        m = m.multiply(new DOMMatrix(s.transform));
    }

    let res = mOri.multiply(m.multiply(mOri.inverse()));

    //@ts-ignore
    const pt = getElementPerspectiveTransform(element);
    if (pt != null) {
        res = pt.multiply(res);
    }
    return res;
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
*/
function getElementPerspectiveTransform(element) {
    /** @type { Element } */
    //@ts-ignore
    const perspectiveNode = getParentElementIncludingSlots(element);
    if (perspectiveNode) {
        //https://drafts.csswg.org/css-transforms-2/#perspective-matrix-computation
        let s = (element.ownerDocument.defaultView ?? window).getComputedStyle(perspectiveNode);
        if (s.perspective !== 'none') {
            let m = new DOMMatrix();
            let p = parseFloat(s.perspective);
            m.m34 = -1.0 / p;
            //https://drafts.csswg.org/css-transforms-2/#PerspectiveDefined
            const origin = s.perspectiveOrigin.split(' ');
            const originX = parseFloat(origin[0]) - element.offsetLeft;
            const originY = parseFloat(origin[1]) - element.offsetTop;

            const mOri = new DOMMatrix().translate(originX, originY);
            const mOriInv = new DOMMatrix().translate(-originX, -originY);

            return mOri.multiply(m.multiply(mOriInv));
        }
    }
    return null;
}