import {
    AbstractExtension, IDesignItem, IDesignerCanvas, IDesignerExtensionProvider, IExtensionManager
} from '@node-projects/web-component-designer';
import type { Disposable } from '@node-projects/base-custom-webcomponent';
import { ZplText } from '../widgets/zpl-text.js';

/** In-place plain-text editor for the shadow-DOM based ZPL text widget. */
export class ZplTextEditExtension extends AbstractExtension {
    private _selectionChangedListener?: Disposable;
    private _finished = false;
    private _originalContent = '';
    private _previousClickOverlayPointerEvents = '';

    constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerCanvas, extendedItem);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onInput = this._onInput.bind(this);
        this._onDocumentPointerDown = this._onDocumentPointerDown.bind(this);
    }

    override extend() {
        const element = this.extendedItem.element as ZplText;
        this._originalContent = this.extendedItem.getAttribute('content') ?? '';

        // Clearing the selection removes resize/position overlays while the
        // caret is active. Subscribe afterwards so this initial clear does not
        // immediately close the editor.
        this.extendedItem.instanceServiceContainer.selectionService.clearSelectedElements();
        this._selectionChangedListener = this.extendedItem.instanceServiceContainer.selectionService.onSelectionChanged.on(
            () => this._finish(true)
        );

        this._previousClickOverlayPointerEvents = this.designerCanvas.clickOverlay.style.pointerEvents;
        this.designerCanvas.clickOverlay.style.pointerEvents = 'none';
        element.beginInlineEdit();
        element.inlineEditElement.addEventListener('keydown', this._onKeyDown, true);
        element.inlineEditElement.addEventListener('input', this._onInput);
        element.ownerDocument.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    }

    override refresh() { /* the widget updates its own bounds while typing */ }

    override dispose() {
        const element = this.extendedItem.element as ZplText;
        element.inlineEditElement.removeEventListener('keydown', this._onKeyDown, true);
        element.inlineEditElement.removeEventListener('input', this._onInput);
        element.ownerDocument.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
        this._selectionChangedListener?.dispose();
        this.designerCanvas.clickOverlay.style.pointerEvents = this._previousClickOverlayPointerEvents;
        element.finishInlineEdit();
    }

    private _onInput(event: Event) {
        event.stopPropagation();
        (this.extendedItem.element as ZplText).refreshInlineEditBounds();
    }

    private _onKeyDown(event: KeyboardEvent) {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            this._finish(true);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this._finish(false);
        }
    }

    private _onDocumentPointerDown(event: PointerEvent) {
        const editor = (this.extendedItem.element as ZplText).inlineEditElement;
        if (event.composedPath().includes(editor)) return;
        this._finish(true);
    }

    private _finish(commit: boolean) {
        if (this._finished) return;
        this._finished = true;
        const element = this.extendedItem.element as ZplText;
        const newContent = element.inlineEditContent;
        element.finishInlineEdit();
        if (commit && newContent !== this._originalContent)
            this.extendedItem.setAttribute('content', newContent);
        this.extensionManager.removeExtensionInstance(this.extendedItem, this);
    }
}

export class ZplTextEditExtensionProvider implements IDesignerExtensionProvider {
    shouldExtend(_extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
        return !designerCanvas.readOnly && designItem.element instanceof ZplText;
    }

    getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem) {
        return new ZplTextEditExtension(extensionManager, designerCanvas, designItem);
    }
}
