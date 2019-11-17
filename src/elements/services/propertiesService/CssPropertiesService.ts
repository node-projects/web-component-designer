import { IPropertiesService } from './IPropertiesService';
import { IProperty } from './IProperty';
import { IDesignItem } from '../../item/IDesignItem';

export class CssPropertiesService implements IPropertiesService {
    
    //@ts-ignore
    private styles: IProperty[] = [
        {
            name: "color",
            type: "color",
            service: this
        }, {
            name: "background-color",
            type: "color",
            service: this
        }, {
            name: "box-sizing",
            type: "list",
            values: ["border-box", "content-box"],
            service: this
        }, {
            name: "border",
            type: "string",
            default: "0px none rbg(0,0,0)",
            service: this
        }, {
            name: "box-shadow",
            type: "string",
            default: "none",
            service: this
        }, {
            name: "opacity",
            type: "number",
            min: 0,
            max: 0,
            service: this
        }, {
            name: "padding",
            type: "thickness",
            service: this
        }, {
            name: "margin",
            type: "thickness",
            service: this
        }, {
            name: "position",
            type: "list",
            values: ["static", "relative", "absolute"],
            service: this
        }, {
            name: "left",
            type: "css-length",
            service: this
        }, {
            name: "top",
            type: "css-length",
            service: this
        }, {
            name: "right",
            type: "css-length",
            service: this
        }, {
            name: "bottom",
            type: "css-length",
            service: this
        }, {
            name: "width",
            type: "css-length",
            service: this
        }, {
            name: "height",
            type: "css-length",
            service: this
        }
    ];

    //@ts-ignore
    private flex: IProperty[] = [
        {
            name: "position",
            type: "list",
            values: ["static", "relative", "absolute"],
            service: this
        }, {
            name: "display",
            type: "list",
            values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"],
            service: this
        }, {
            name: "flex-direction",
            type: "list",
            values: ["row", "row-reverse", "column", "column-reverse"],
            service: this
        }, {
            name: "flex-wrap",
            type: "list",
            values: ["nowrap", "wrap", "warp-reverse"],
            service: this
        }, {
            name: "justify-self",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "justify-items",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "justify-content",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "align-self",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "align-items",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "align-content",
            type: "list",
            values: ["flex-start", "center", "flex-end", "space-between", "space-around"],
            service: this
        }, {
            name: "flex",
            type: "string",
            default: "0 1 auto",
            service: this
        }
    ];

    name: "flex" | "styles" ;

    constructor(name: "flex" | "styles") {
        this.name = name;
    }

    isHandledElement(designItem: IDesignItem): boolean {
        return true;
    }

    getProperties(designItem: IDesignItem): IProperty[] {
        return this[this.name];
    }

    setValue(designItem: IDesignItem, property: IProperty, value: any) {
        // let oldValue = (<HTMLElement>designItem.element).style[property.name];

        // let doFunc = () => (<HTMLElement>designItem.element).style[property.name].value = value;
        // let undoFunc = () => (<HTMLElement>designItem.element).style[property.name].value = oldValue;

        /*serviceContainer.actionHistory.add(UndoItemType.Update, this.activeElement,
            {
              type: detail.type, name: detail.name,
              new: { value: detail.value },
              old: { value: oldValue }
            });*/
    }

    getValue(designItem: IDesignItem, property: IProperty) {
        return (<HTMLElement>designItem.element).style[property.name];
    }
}