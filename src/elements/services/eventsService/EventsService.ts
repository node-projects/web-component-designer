import { IDesignItem } from "../../item/IDesignItem.js";
import { IEvent } from "./IEvent.js";
import { IEventsService } from "./IEventsService.js";

export class EventsService implements IEventsService {
    
    protected _windowEvents = [
        "afterprint",
        "beforeprint",
        "beforeunload",
        "error",
        "hashchange",
        "load",
        "message",
        "offline",
        "online",
        "pageshow",
        "popstate",
        "resize",
        "storage",
        "unload"
    ]

    protected _allElements = [
        "contextmenu",
    ]

    protected _focusableEvents = [
        "blur",
        "focus",
        "keydown",
        "keypress",
        "keyup"
    ]

    protected _form = [
        "change",
        "input",
        "invalid",
        "reset",
        "search",
        "select",
        "submit"
    ]

    protected _mouseEvents = [
        "click",
        "dblclick",
        "mousedown",
        "mouseup",
        "mousemove",
        "mouseover",
        "mouseout",
        "mousewheel",
        "wheel"
    ]

    protected _pointerEvents = [
        "pointerdown",
        "pointerup",
        "pointerenter",
        "pointerleave",
        "pointermove",
        "pointerover",
        "pointerout",
        "pointercancel"
    ]

    protected _touchEvents = [
        "touchstart",
        "touchend",
        "touchmove",
        "touchcancel"
    ]

    protected _dragEvents = [
        "drag",
        "dragend",
        "dragenter",
        "dragleave",
        "dragover",
        "dragstart",
        "drop",
        "scroll"
    ]

    protected _clipboard = [
        "copy",
        "cut",
        "paste"
    ]

    protected _details = [
        "toggle"
    ]

    isHandledElement(designItem: IDesignItem): boolean {
        return true;
    }

    public getPossibleEvents(designItem: IDesignItem): IEvent[] {
        //Todo: create corret events list for all std. elements
        let lst = [...this._mouseEvents, ...this._allElements, ...this._focusableEvents];
        let events: IEvent[] = lst.map(x => ({ name: x, propertyName: 'on' + x }));
        return events;
    }
}