import { IDesignItem } from "../../item/IDesignItem.js";
import { IEvent } from "./IEvent.js";
import { IEventsService } from "./IEventsService.js";

export class EventsService implements IEventsService {

    constructor() {
        this._allEvents = [...this._windowEvents, ...this._form, ...this._simpleMouseEvents, ...this._mouseEvents, ...this._pointerEvents, ...this._touchEvents, ...this._allElements, ...this._focusableEvents, ...this._dragEvents, ...this._clipboard, ...this._dragEvents];
    }

    protected _allEvents: IEvent[];

    protected _windowEvents = [
        { name: "afterprint", propertyName: "onafterprint", eventObjectName: "Event" },
        { name: "beforeprint", propertyName: "onbeforeprint", eventObjectName: "Event" },
        { name: "beforeunload", propertyName: "onbeforeunload", eventObjectName: "Event" },
        { name: "error", propertyName: "onerror", eventObjectName: "Event" },
        { name: "load", propertyName: "onload", eventObjectName: "Event" },
        { name: "hashchange", propertyName: "onhashchange", eventObjectName: "Event" },
        { name: "message", propertyName: "onmessage", eventObjectName: "Event" },
        { name: "offline", propertyName: "onoffline", eventObjectName: "Event" },
        { name: "online", propertyName: "ononline", eventObjectName: "Event" },
        { name: "pageshow", propertyName: "onpageshow", eventObjectName: "Event" },
        { name: "popstate", propertyName: "onpopstate", eventObjectName: "Event" },
        { name: "resize", propertyName: "onresize", eventObjectName: "Event" },
        { name: "storage", propertyName: "onstorage", eventObjectName: "Event" },
        { name: "unload", propertyName: "onunload", eventObjectName: "Event" }
    ]

    protected _allElements: IEvent[] = [
        { name: "contextmenu", propertyName: "oncontextmenu", eventObjectName: "PointerEvent" }
    ]

    protected _focusableEvents = [
        { name: "blur", propertyName: "onblur", eventObjectName: "FocusEvent" },
        { name: "focus", propertyName: "onfocus", eventObjectName: "FocusEvent" },
        { name: "keydown", propertyName: "onkeydown", eventObjectName: "KeyboardEvent" },
        { name: "keyup", propertyName: "onkeyup", eventObjectName: "KeyboardEvent" }
    ]

    protected _simpleForm = [
        { name: "input", propertyName: "oninput", eventObjectName: "InputEvent" },
        { name: "change", propertyName: "onchange", eventObjectName: "Event" }
    ]

    protected _form = [
      { name: "beforeinput", propertyName: "onbeforeinput", eventObjectName: "InputEvent" },
      { name: "invalid", propertyName: "oninvalid", eventObjectName: "Event" },
      { name: "reset", propertyName: "onreset", eventObjectName: "Event" },
      { name: "select", propertyName: "onselect", eventObjectName: "Event" },
      { name: "submit", propertyName: "onsubmit", eventObjectName: "SubmitEvent" }
  ]

    protected _simpleMouseEvents: IEvent[] = [
        { name: "click", propertyName: "onclick", eventObjectName: "PointerEvent" },
        { name: "dblclick", propertyName: "ondblclick", eventObjectName: "MouseEvent" },
        { name: "wheel", propertyName: "onwheel", eventObjectName: "WheelEvent" },
        { name: "scroll", propertyName: "onscroll", eventObjectName: "Event" },
    ]

    protected _mouseEvents = [
        { name: "mousedown", propertyName: "onmousedown", eventObjectName: "MouseEvent" },
        { name: "mouseup", propertyName: "onmouseup", eventObjectName: "MouseEvent" },
        { name: "mousemove", propertyName: "onmousemove", eventObjectName: "MouseEvent" },
        { name: "mouseover", propertyName: "onmouseover", eventObjectName: "MouseEvent" },
        { name: "mouseout", propertyName: "onmouseout", eventObjectName: "MouseEvent" }
    ]

    protected _pointerEvents: IEvent[] = [
        { name: "pointerdown", propertyName: "onpointerdown", eventObjectName: "PointerEvent" },
        { name: "pointerup", propertyName: "onpointerup", eventObjectName: "PointerEvent" },
        { name: "pointerenter", propertyName: "onpointerenter", eventObjectName: "PointerEvent" },
        { name: "pointerleave", propertyName: "onpointerleave", eventObjectName: "PointerEvent" },
        { name: "pointermove", propertyName: "onpointermove", eventObjectName: "PointerEvent" },
        { name: "pointerover", propertyName: "onpointerover", eventObjectName: "PointerEvent" },
        { name: "pointerout", propertyName: "onpointerout", eventObjectName: "PointerEvent" },
        { name: "pointercancel", propertyName: "onpointercancel", eventObjectName: "PointerEvent" }
    ]

    protected _touchEvents: IEvent[] = [
        { name: "touchstart", propertyName: "ontouchstart", eventObjectName: "TouchEvent" },
        { name: "touchend", propertyName: "ontouchend", eventObjectName: "TouchEvent" },
        { name: "touchmove", propertyName: "ontouchmove", eventObjectName: "TouchEvent" },
        { name: "touchcancel", propertyName: "ontouchcancel", eventObjectName: "TouchEvent" }
    ]

    protected _dragEvents = [
        { name: "drag", propertyName: "ondrag", eventObjectName: "DragEvent" },
        { name: "dragend", propertyName: "ondragend", eventObjectName: "DragEvent" },
        { name: "dragenter", propertyName: "ondragenter", eventObjectName: "DragEvent" },
        { name: "dragleave", propertyName: "ondragleave", eventObjectName: "DragEvent" },
        { name: "dragover", propertyName: "ondragover", eventObjectName: "DragEvent" },
        { name: "dragstart", propertyName: "ondragstart", eventObjectName: "DragEvent" },
        { name: "drop", propertyName: "ondrop", eventObjectName: "DragEvent" }
    ]

    protected _clipboard = [
        { name: "copy", propertyName: "oncopy", eventObjectName: "ClipboardEvent" },
        { name: "cut", propertyName: "oncut", eventObjectName: "ClipboardEvent" },
        { name: "paste", propertyName: "onpaste", eventObjectName: "ClipboardEvent" }
    ]

    protected _details = [
        { name: "toggle", propertyName: "ontoggle", eventObjectName: "Event" }
    ]

    isHandledElement(designItem: IDesignItem): boolean {
        return true;
    }

    public getPossibleEvents(designItem: IDesignItem): IEvent[] {
        if (designItem.element instanceof designItem.window.HTMLInputElement ||
            designItem.element instanceof designItem.window.HTMLTextAreaElement ||
            designItem.element instanceof designItem.window.HTMLSelectElement) {
            let events: IEvent[] = [...this._simpleForm, ...this._simpleMouseEvents, ...this._form,  ...this._pointerEvents, ...this._allElements, ...this._focusableEvents];
            return events;
        }
        let events: IEvent[] = [...this._simpleMouseEvents, ...this._pointerEvents, ...this._allElements, ...this._focusableEvents];
        return events;
    }

    public getEvent(name: string): IEvent {
        let evt = this._allEvents.find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}