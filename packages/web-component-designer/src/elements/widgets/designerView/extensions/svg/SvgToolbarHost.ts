import type { IDesignerCanvas } from '../../IDesignerCanvas.js';

/** Dock outside canvas overlays, keeping authored geometry at the same screen position. */
export function mountSvgToolbar(canvas: IDesignerCanvas, toolbar: HTMLElement): () => void {
  const host = canvas.shadowRoot.querySelector<HTMLElement>('#node-projects-designer-svg-toolbar');
  let height = host.offsetHeight;
  const preserveAnchor = () => {
    const next = host.offsetHeight;
    if (canvas.isConnected && next !== height) canvas.canvasOffset = {
      x: canvas.canvasOffset.x, y: canvas.canvasOffset.y - (next - height) / canvas.zoomFactor
    };
    height = next;
  };
  const display = toolbar.style.display;
  const visibility = () => {
    const visible = canvas.serviceContainer.options.svgEditingToolbar;
    toolbar.hidden = !visible;
    toolbar.style.display = visible ? display : 'none';
    preserveAnchor();
  };
  toolbar.onpointerenter = event => canvas.showHoverExtension(canvas.canvas, event);
  toolbar.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
  toolbar.style.position = 'relative';
  toolbar.style.top = toolbar.style.left = '0';
  toolbar.style.maxWidth = '100%';
  host.append(toolbar);
  visibility();
  const observer = new ResizeObserver(preserveAnchor);
  observer.observe(host);
  canvas.addEventListener('svg-toolbar-visibility-changed', visibility);
  return () => {
    observer.disconnect();
    canvas.removeEventListener('svg-toolbar-visibility-changed', visibility);
    toolbar.remove();
    preserveAnchor();
  };
}
