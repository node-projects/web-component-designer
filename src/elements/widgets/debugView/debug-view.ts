import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { DesignItem } from "../../item/DesignItem.js";


function generateSelector(element) {
    if (!element)
        return '';
    let selector, tag = element.nodeName.toLowerCase();
    if (element.id) {
        selector = '#' + element.getAttribute('id');
    } else if (element.getAttribute('class')) {
        selector = '.' + element.getAttribute('class').split(' ').join('.');
    }
    return selector ? tag + selector : tag;
}

const getClosestStackingContext = function (node) {
    // the root element (HTML).
    if (!node || node.nodeName === 'HTML') {
        return { node: document.documentElement, reason: 'root' };
    }

    // handle shadow root elements.
    if (node.nodeName === '#document-fragment') {
        return getClosestStackingContext(node.host);
    }

    const computedStyle = getComputedStyle(node);

    // position: fixed or sticky.
    if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
        return { node: node, reason: `position: ${computedStyle.position}` };
    }

    // positioned (absolutely or relatively) with a z-index value other than "auto".
    if (computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static') {
        return { node: node, reason: `position: ${computedStyle.position}; z-index: ${computedStyle.zIndex}` };
    }

    // elements with an opacity value less than 1.
    if (computedStyle.opacity !== '1') {
        return { node: node, reason: `opacity: ${computedStyle.opacity}` };
    }

    // elements with a transform value other than "none".
    if (computedStyle.transform !== 'none') {
        return { node: node, reason: `transform: ${computedStyle.transform}` };
    }

    // elements with a mix-blend-mode value other than "normal".
    if (computedStyle.mixBlendMode !== 'normal') {
        return { node: node, reason: `mixBlendMode: ${computedStyle.mixBlendMode}` };
    }

    // elements with a filter value other than "none".
    if (computedStyle.filter !== 'none') {
        return { node: node, reason: `filter: ${computedStyle.filter}` };
    }

    // elements with a perspective value other than "none".
    if (computedStyle.perspective !== 'none') {
        return { node: node, reason: `perspective: ${computedStyle.perspective}` };
    }

    // elements with a clip-path value other than "none".
    if (computedStyle.clipPath !== 'none') {
        return { node: node, reason: `clip-path: ${computedStyle.clipPath} ` };
    }

    // elements with a mask value other than "none".
    const mask = computedStyle.mask || computedStyle.webkitMask;
    if (mask !== 'none' && mask !== undefined) {
        return { node: node, reason: `mask:  ${mask}` };
    }

    // elements with a mask-image value other than "none".
    const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
    if (maskImage !== 'none' && maskImage !== undefined) {
        return { node: node, reason: `mask-image: ${maskImage}` };
    }

    // elements with a mask-border value other than "none".
    //@ts-ignore
    const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
    if (maskBorder !== 'none' && maskBorder !== undefined) {
        return { node: node, reason: `mask-border: ${maskBorder}` };
    }

    // elements with isolation set to "isolate".
    if (computedStyle.isolation === 'isolate') {
        return { node: node, reason: `isolation: ${computedStyle.isolation}` };
    }

    // transform or opacity in will-change even if you don't specify values for these attributes directly.
    if (computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity') {
        return { node: node, reason: `willChange: ${computedStyle.willChange}` };
    }

    // an item with a z-index value other than "auto".
    if (computedStyle.zIndex !== 'auto') {
        const parentStyle = getComputedStyle(node.parentNode);
        // with a flex|inline-flex parent.
        if (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex') {
            return {
                node: node,
                reason: `flex-item; z-index: ${computedStyle.zIndex}`,
            };
            // with a grid parent.
        } else if (parentStyle.grid !== 'none / none / none / row / auto / auto') {
            return {
                node: node,
                reason: `child of grid container; z-index: ${computedStyle.zIndex}`,
            };
        }
    }

    // contain with a value of layout, or paint, or a composite value that includes either of them
    const contain = computedStyle.contain;
    if (['layout', 'paint', 'strict', 'content'].indexOf(contain) > -1 ||
        contain.indexOf('paint') > -1 ||
        contain.indexOf('layout') > -1
    ) {
        return {
            node: node,
            reason: `contain: ${contain}`,
        };
    }

    return getClosestStackingContext(node.parentNode);
};

export class DebugView extends BaseCustomWebComponentConstructorAppend {

    public static override readonly template = html`
        <div>
            <table>
                    <tr><th colspan="2">Styling</th></tr>
                    <tr><td>display</td><td>[[?this.computedStyle.display]]</td></tr>
                    <tr><td>position</td><td>[[?this.computedStyle.position]]</td></tr>
                    <tr><td>visibility</td><td>[[?this.computedStyle.visibility]]</td></tr>
                    <tr><td>pointerEvents</td><td>[[?this.computedStyle.pointerEvents]]</td></tr>
                    <tr><td>zIndex</td><td>[[?this.computedStyle.zIndex]]</td></tr>
                    <tr><th colspan="2">Context</th></tr>
                    <tr><td>offsetParent</td><td class="lnk" @click="[[this._clickLink(event, 'offsetParent')]]">[[?this.selectedElementOffsetParentText]]</td></tr>
                    <tr><td>createsStackingContext</td><td>[[this.createsStackingContext]]</td></tr>
                    <tr><td>stackingContextReason</td><td>[[this.createsStackingContextReason]]</td></tr>
                    <tr><td>stackingContextParent</td><td class="lnk" @click="[[this._clickLink(event, 'stackingContextParent')]]">[[?this.parentStackingContextText]]</td></tr>
            </table>
        </div> 
    `;

    public static override readonly style = css`
      :host {
        overflow: auto;
        height: 100%;
        display: block;
      }
      table {
        font-family: Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }
      
      table td, table th {
        border: 1px solid #ddd;
        padding: 2px 4px;
      }
      
      table tr:nth-child(even){background-color: #f2f2f2;}
      
      table tr:hover {background-color: #ddd;}
      
      table th {
        text-align: left;
        background-color: #989898;
        color: white;
      }
      
      .lnk {
        color: blue;
      }
      .lnk:hover {
        text-decoration: underline;
        cursor: pointer;
      }`;

    private _ready: boolean;
    computedStyle: CSSStyleDeclaration;
    createsStackingContext: boolean;
    createsStackingContextReason: string;
    parentStackingContext: Element;
    parentStackingContextText: string;
    selectedElementOffsetParent: Element;
    selectedElementOffsetParentText: string;

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    ready() {
        this._parseAttributesToProperties();

        this._bindingsParse();
        this._ready = true;
    }

    _clickLink(e: MouseEvent, target: 'offsetParent' | 'stackingContextParent') {
        if (target == 'offsetParent') {
            if (this.selectedElementOffsetParent) {
                let di = DesignItem.GetDesignItem(this.selectedElementOffsetParent);
                di.instanceServiceContainer.selectionService.setSelectedElements([di]);
            }
        } else if (target == 'stackingContextParent') {
            if (this.parentStackingContext) {
                let di = DesignItem.GetDesignItem(this.parentStackingContext);
                di.instanceServiceContainer.selectionService.setSelectedElements([di]);
            }
        }
    }

    update(designItem: IDesignItem) {
        if (this._ready) {
            requestAnimationFrame(() => {
                let element = designItem?.element;
                if (element && element.nodeType != 8) {
                    if (element.nodeType == 3)
                        element = element.parentNode as Element;
                    this.computedStyle = getComputedStyle(element);
                    this.selectedElementOffsetParent = (<HTMLElement>element).offsetParent;
                    if (this.selectedElementOffsetParent == designItem.instanceServiceContainer.designerCanvas.rootDesignItem.element) {
                        this.selectedElementOffsetParentText = null;
                        this.selectedElementOffsetParent = null;
                    } else
                        this.selectedElementOffsetParentText = generateSelector((<HTMLElement>element).offsetParent);

                    if (element && element.nodeType === 1) {

                        const closest = getClosestStackingContext(element);
                        this.createsStackingContext = element === closest.node;
                        this.createsStackingContextReason = this.createsStackingContext ? closest.reason : 'not a stacking context';
                        this.parentStackingContext = closest.node;
                        if (this.createsStackingContext && element.nodeName !== 'HTML') {
                            this.parentStackingContext = getClosestStackingContext(element.parentNode).node;
                        }
                        if (this.parentStackingContext == designItem.instanceServiceContainer.designerCanvas.rootDesignItem.element.parentElement.parentElement) {
                            this.parentStackingContextText = null;
                            this.parentStackingContext = null;
                        } else
                            this.parentStackingContextText = generateSelector(this.parentStackingContext);
                    }
                } else {
                    //@ts-ignore
                    this.computedStyle = {};
                    this.createsStackingContext = false;
                    this.createsStackingContextReason = '';
                    this.createsStackingContext = false;
                    this.selectedElementOffsetParent = null;
                    this.selectedElementOffsetParentText = null;
                    this.parentStackingContext = null;
                    this.parentStackingContextText = null;
                }

                this._bindingsRefresh();
            });
        }
    }
}

customElements.define('node-projects-debug-view', DebugView);