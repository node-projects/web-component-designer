//included from: https://github.com/chdh/plain-scrollbar

class Widget {

    private host:                       PlainScrollbar;
    private root:                       HTMLElement;
    private trough:                     HTMLElement;
    private button1:                    HTMLElement;                  // up/left button
    private button2:                    HTMLElement;                  // down/right button
    private thumb:                      HTMLElement;
    private isConnected:                boolean = false;
 
    public  thumbSize:                  number = 0.3;                 // relative thumb size (0..1)
    public  value:                      number = 0;                   // current scrollbar position (0..1)
    public  orientation:                boolean = false;              // false=horizontal, true=vertical
    private clickRepeatDelay:           number = 300;                 // click repetition delay time in ms
    private clickRepeatInterval:        number = 100;                 // click repetition interval time in ms
    private defaultThumbMinSize:        number = 25;                  // default for minimum thumb size in pixels
 
    private dragStartPos:               number;                       // dragging start pointer position (clientX/Y)
    private dragStartValue:             number;                       // dragging start scrollbar position
    private eventTimeoutId:             NodeJS.Timeout | undefined;
 
    private pointerCaptureId:           number | undefined;           // `undefined` = no capture active
    private pointerCaptureElement:      HTMLElement;
 
    // User interaction state:
    private thumbDragging:              boolean;                      // true while user is dragging the thumb
    private button1Active:              boolean;                      // true while user has pointer clicked down on button 1
    private button2Active:              boolean;                      // true while user has pointer clicked down on button 2
    private troughActive:               boolean;                      // true while user has pointer clicked down on trough
 
    public constructor (host: PlainScrollbar) {
       this.host = host;
       host.attachShadow({mode: "open"});
       const shadowRoot = host.shadowRoot!;
       shadowRoot.innerHTML = scrollbarHtmlTemplate;
       this.root    = <HTMLElement>shadowRoot.querySelector("#root")!;
       this.trough  = <HTMLElement>shadowRoot.querySelector("#trough")!;
       this.button1 = <HTMLElement>shadowRoot.querySelector("#button1")!;
       this.button2 = <HTMLElement>shadowRoot.querySelector("#button2")!;
       this.thumb   = <HTMLElement>shadowRoot.querySelector("#thumb")!;
       this.trough.addEventListener( "pointerdown",   this.onTroughPointerDown);
       this.trough.addEventListener( "pointerup",     this.onPointerUp);
       this.trough.addEventListener( "pointercancel", this.onPointerUp);
       this.button1.addEventListener("pointerdown",   (event: PointerEvent) => this.onButtonPointerDown(event, 1));
       this.button1.addEventListener("pointerup",     this.onPointerUp);
       this.button1.addEventListener("pointercancel", this.onPointerUp);
       this.button1.addEventListener("contextmenu",   (e: Event) => e.preventDefault()); // to prevent popup on long touch
       this.button2.addEventListener("pointerdown",   (event: PointerEvent) => this.onButtonPointerDown(event, 2));
       this.button2.addEventListener("pointerup",     this.onPointerUp);
       this.button2.addEventListener("pointercancel", this.onPointerUp);
       this.button2.addEventListener("contextmenu",   (e: Event) => e.preventDefault()); // to prevent popup on long touch
       this.thumb.addEventListener(  "pointerdown",   this.onThumbPointerDown);
       this.thumb.addEventListener(  "pointerup",     this.onPointerUp);
       this.thumb.addEventListener(  "pointercancel", this.onPointerUp);
       this.thumb.addEventListener(  "pointermove",   this.onThumbPointerMove);
       this.resetInteractionState(); }
       
 
    private resetInteractionState() {
       this.thumbDragging = false;
       this.button1Active = false;
       this.button2Active = false;
       this.troughActive  = false; }
 
    public connectedCallback() {
       this.isConnected = true;
       this.resetInteractionState();
       this.updateLayout();
       this.updateStyle(); }
 
    public disconnectedCallback() {
       this.isConnected = false;
       this.resetInteractionState();
       this.stopEventRepetition();
       this.stopPointerCapture(); }
 
    public updateLayout() {
       if (!this.isConnected) {
          return; }
       this.root.classList.toggle("horizontal", !this.orientation);
       this.root.classList.toggle("vertical", this.orientation);
       this.thumb.style.display = (this.thumbSize == 0) ? "none" : "";
       this.thumb.style.height = this.orientation ? percent(this.getEffectiveThumbSize()) : "";
       this.thumb.style.width  = this.orientation ? "": percent(this.getEffectiveThumbSize());
       this.thumb.style.top = "";
       this.thumb.style.left = "";
       this.updateThumbPosition(); }
 
    private updateStyle() {
       if (!this.isConnected) {
          return; }
       this.thumb.classList.toggle("active", this.thumbDragging);
       this.button1.classList.toggle("active", this.button1Active);
       this.button2.classList.toggle("active", this.button2Active);
       void this.troughActive; }                                      // tslint:disable-line
 
    public updateThumbPosition() {
       const v = (1 - this.getEffectiveThumbSize()) * this.value;
       if (this.orientation) {
          this.thumb.style.top = percent(v); }
        else {
          this.thumb.style.left = percent(v); }}
 
    private getThroughSize() : number {
       return this.orientation ? this.trough.clientHeight : this.trough.clientWidth; }
 
    private computeThumbMoveValue (distancePixels: number) : number {
       const troughSlidePixels = this.getThroughSize() * (1 - this.getEffectiveThumbSize());
       if (troughSlidePixels < EPS) {
          return 0; }
       return distancePixels / troughSlidePixels; }
 
    public setThumbSize (newThumbSize: number) {
       const clippedNewThumbSize = Math.max(0, Math.min(1, newThumbSize));
       if (clippedNewThumbSize == this.thumbSize) {
          return; }
       this.thumbSize = clippedNewThumbSize;
       this.updateLayout(); }
 
    private getThumbMinSize() : number {
       const s = this.getCssVar("--plain-scrollbar-thumb-min-size");
       if (!s ) {
          return this.defaultThumbMinSize; }
       const px = decodePxValue(s);
       if (!px) {
          return this.defaultThumbMinSize; }
       return px; }
 
    private getEffectiveThumbSize() : number {
       const thumbMinSize = this.getThumbMinSize();
       const throughSize = this.getThroughSize();
       if (!throughSize) {
          return this.thumbSize; }
       const min = Math.min(1, thumbMinSize / throughSize);
       return Math.max(min, this.thumbSize); }
 
    public setValue (newValue: number) : boolean {
       const clippedNewValue = Math.max(0, Math.min(1, newValue));
       if (clippedNewValue == this.value) {
          return false; }
       this.value = clippedNewValue;
       this.updateThumbPosition();
       return true; }
 
    public setOrientation (newOrientation: boolean) : boolean {
       if (newOrientation == this.orientation) {
          return false; }
       this.orientation = newOrientation;
       this.updateLayout();
       return true; }
 
    private getCssVar (varName: string) : string | undefined {
       const s = getComputedStyle(this.root).getPropertyValue(varName);
       if (!s) {
          return null; }
       return s.trim(); }
 
    //--- Outgoing events -------------------------------------------------------
 
    private fireEvent (eventSubType: string) {
       const event = new CustomEvent("scrollbar-input", { detail: eventSubType });
       this.host.dispatchEvent(event); }
 
    private fireEventRepeatedly (eventSubType: string, repeatDelay: number, repeatInterval: number, repeatCounter = 0) {
       this.stopEventRepetition();
       this.fireEvent(eventSubType);
       const delay = (repeatCounter == 0) ? repeatDelay : repeatInterval;
       const f = () => this.fireEventRepeatedly(eventSubType, repeatDelay, repeatInterval, repeatCounter + 1);
       this.eventTimeoutId = setTimeout(f, delay); }
 
    private stopEventRepetition() {
       if (this.eventTimeoutId) {
         clearTimeout(this.eventTimeoutId);
         this.eventTimeoutId = undefined; }}
 
    //--- Pointer input ----------------------------------------------------------
 
    private startPointerCapture (element: HTMLElement, pointerId: number) {
       this.stopPointerCapture();
       element.setPointerCapture(pointerId);
       this.pointerCaptureElement = element;
       this.pointerCaptureId = pointerId; }
 
    private stopPointerCapture() {
       if (!this.pointerCaptureId) {
          return; }
       this.pointerCaptureElement.releasePointerCapture(this.pointerCaptureId);
       this.pointerCaptureId = undefined; }
 
    private onTroughPointerDown = (event: PointerEvent) => {
       if (!this.isConnected || this.pointerCaptureId) {
          return; }
       if (!event.isPrimary || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button != 0) {
          return; }
       const r = this.trough.getBoundingClientRect();
       const pos = this.orientation ? event.clientY - r.top : event.clientX - r.left;
       const threshold = (this.orientation ? r.height : r.width) * (1 - this.getEffectiveThumbSize()) * this.value;
       const direction = pos > threshold;
       const eventSubType = direction ? "incrementLarge" : "decrementLarge";
       this.troughActive = true;
       event.preventDefault();
       this.startPointerCapture(this.trough, event.pointerId);
       this.fireEventRepeatedly(eventSubType, this.clickRepeatDelay, this.clickRepeatInterval); };
 
    private onButtonPointerDown = (event: PointerEvent, buttonNo: number) => {
       if (!this.isConnected || this.pointerCaptureId) {
          return; }
       if (!event.isPrimary || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button != 0) {
          return; }
       switch (buttonNo) {
          case 1: this.button1Active = true; break;
          case 2: this.button2Active = true; break; }
       const eventSubType = (buttonNo == 1) ? "decrementSmall" : "incrementSmall";
       this.updateStyle();
       event.preventDefault();
       const buttonElement = (buttonNo == 1) ? this.button1 : this.button2;
       this.startPointerCapture(buttonElement, event.pointerId);
       this.fireEventRepeatedly(eventSubType, this.clickRepeatDelay, this.clickRepeatInterval); };
 
    private onThumbPointerDown = (event: PointerEvent) => {
       if (!this.isConnected || this.pointerCaptureId) {
          return; }
       if (!event.isPrimary || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button != 0) {
          return; }
       this.dragStartPos = this.orientation ? event.clientY : event.clientX;
       this.dragStartValue = this.value;
       this.thumbDragging = true;
       this.updateStyle();
       event.preventDefault();
       this.startPointerCapture(this.thumb, event.pointerId); };
 
    private onThumbPointerMove = (event: PointerEvent) => {
       if (!this.isConnected) {
          return; }
       if (!event.isPrimary || ! this.thumbDragging) {
          return; }
       const pos = this.orientation ? event.clientY : event.clientX;
       const deltaPixels = pos - this.dragStartPos;
       const deltaValue = this.computeThumbMoveValue(deltaPixels);
       const newValue = this.dragStartValue + deltaValue;
       event.preventDefault();
       if (this.setValue(newValue)) {
          this.fireEvent("value"); }};
 
    private onPointerUp = (event: PointerEvent) => {
       if (!this.isConnected) {
          return; }
       if (!event.isPrimary) {
          return; }
       this.resetInteractionState();
       this.updateStyle();
       this.stopEventRepetition();
       this.stopPointerCapture();
       event.preventDefault(); };
 
    } // end class
 
 //--- Custom Element -----------------------------------------------------------
 
 export class PlainScrollbar extends HTMLElement {
 
    private widget:           Widget;
 
    public constructor() {
       super();
       const value = parseFloat(this.getAttribute("value"));
       this.widget = new Widget(this); 
       if (!isNaN(value))
            this.widget.value = value}
 
    /* @Override */ public connectedCallback() {
       this.widget.connectedCallback(); }
 
    /* @Override */ public disconnectedCallback() {
       this.widget.disconnectedCallback(); }
 
    //--- Element properties ----------------------------------------------------
 
    // Size of the thumb, relative to the trough.
    // A value between 0 and 1.
    // 0 is used to hide the thumb. Small values greater than 0 are overridden by `plain-scrollbar-thumb-min-size`.
    public get thumbSize() : number {
       return this.widget.thumbSize; }
    public set thumbSize (v: number) {
       this.widget.setThumbSize(v); }
 
    // The current position of the scrollbar.
    // A value between 0 and 1.
    public get value() : number {
       return this.widget.value; }
    public set value (v: number) {
       this.widget.setValue(v); }
 
    // Orientation of the scrollbar.
    // "horizontal" or "vertical".
    public get orientation() : string {
       return formatOrientation(this.widget.orientation); }
    public set orientation (s: string) {
       if (this.widget.setOrientation(decodeOrientation(s))) {
          this.setAttribute("orientation", this.orientation); }}
 
    // Returns false=horizontal, true=vertical.
    public get orientationBoolean() : boolean {
       return this.widget.orientation; }
 
    //--- Element attributes ----------------------------------------------------
 
    /* @Override */ public static get observedAttributes() {
         return ["orientation"]; }
 
    /* @Override */ public attributeChangedCallback (attrName: string, _oldValue: string|null, newValue: string|null) {
       switch (attrName) {
          case "orientation": {
             if (newValue) {
                this.widget.setOrientation(decodeOrientation(newValue)); }
             break; }}}
 
    } // end class
 
 //------------------------------------------------------------------------------
 
 const EPS        = 1E-9;
 const buttonSize = "var(--plain-scrollbar-button-size, 13px)";
 const buttonPath = '<path d="M -60 30 h 120 L 0 -30 z" stroke-width="0"/>';
 
 const scrollbarStyle = `
    :host {
       display: block;
       contain: content;
       background-color: #f8f8f8;
       border-style: solid;
       border-width: 1px;
       border-color: #dddddd;
    }
    #root {
       touch-action: none;
       user-select: none;
       box-sizing: border-box;
       position: relative;
       width: 100%;
       height: 100%;
    }
    #trough {
       position: absolute;
    }
    #root.vertical #trough {
       width: 100%;
       top: ${buttonSize};
       bottom: ${buttonSize};
    }
    #root.horizontal #trough {
       height: 100%;
       left: ${buttonSize};
       right: ${buttonSize};
    }
    #thumb {
       box-sizing: border-box;
       position: absolute;
       width: 100%;
       height: 100%;
       background-color: var(--plain-scrollbar-thumb-background-color, #f0f0f0);
       border-style: solid;
       border-width: var(--plain-scrollbar-thumb-border-width, 1px);
       border-color: var(--plain-scrollbar-thumb-border-color, #b8b8b8);
       border-radius: var(--plain-scrollbar-thumb-border-radius, 4px);
       transition: background-color 50ms linear;
    }
    #thumb:hover {
       background-color: var(--plain-scrollbar-thumb-background-color-hover, #e0e0e0);
    }
    #thumb.active {
       background-color: var(--plain-scrollbar-thumb-background-color-active, #c0c0c0);
    }
    #button1,
    #button2 {
       box-sizing: border-box;
       position: absolute;
       display: block;
       fill: var(--plain-scrollbar-button-color, #606060);
    }
    #root.vertical #button1 {
       top: 0;
       width: 100%;
       height: ${buttonSize};
    }
    #root.vertical #button2 {
       bottom: 0;
       width: 100%;
       height: ${buttonSize};
    }
    #root.horizontal #button1 {
       left: 0;
       height: 100%;
       width: ${buttonSize};
    }
    #root.horizontal #button2 {
       right: 0;
       height: 100%;
       width: ${buttonSize};
    }
    #upArrow,
    #downArrow,
    #leftArrow,
    #rightArrow {
       display: none;
       width: 100%;
       height: 100%;
    }
    #root.vertical #upArrow,
    #root.vertical #downArrow {
       display: block;
    }
    #root.horizontal #leftArrow,
    #root.horizontal #rightArrow {
       display: block;
    }
    #button1:hover,
    #button2:hover {
       background-color: var(--plain-scrollbar-button-color-hover, #e0e0e0);
    }
    #button1.active,
    #button2.active {
       background-color: var(--plain-scrollbar-button-color-active, #c0c0c0);
    }
    `;
 
 const scrollbarHtmlTemplate = `
    <style>${scrollbarStyle}</style>
    <div id="root" part="root">
     <div id="button1" part="button button1">
      <svg id="upArrow" part="arrow upArrow" viewBox="-100 -100 200 200">${buttonPath}</svg>
      <svg id="leftArrow" part="arrow leftArrow" viewBox="-100 -100 200 200"><g transform="rotate(-90)">${buttonPath}</g></svg>
     </div>
     <div id="trough" part="trough">
      <div id="thumb" part="thumb"></div>
     </div>
     <div id="button2" part="button button2">
      <svg id="downArrow" part="arrow downArrow" viewBox="-100 -100 200 200"><g transform="rotate(180)">${buttonPath}</g></svg>
      <svg id="rightArrow" part="arrow rightArrow" viewBox="-100 -100 200 200"><g transform="rotate(90)">${buttonPath}</g></svg>
     </div>
    </div>
    `;
 
 //------------------------------------------------------------------------------
 
 function formatOrientation (b: boolean) : string {
    return b ? "vertical" : "horizontal"; }
 
 function decodeOrientation (s: string) : boolean {
    switch (s) {
       case "vertical":   return true;
       case "horizontal": return false;
       default:           throw new Error("Invalid orientation value \"" + s + "\"."); }}
 
 function percent (v: number) : string {
    return (v * 100).toFixed(3) + "%"; }
 
 function decodePxValue (s: string) : number | undefined {
    if (!s || !s.endsWith("px")) {
       return undefined; }
    return Number(s.substring(0, s.length - 2)); }
 
customElements.define("node-projects-plain-scrollbar", PlainScrollbar);