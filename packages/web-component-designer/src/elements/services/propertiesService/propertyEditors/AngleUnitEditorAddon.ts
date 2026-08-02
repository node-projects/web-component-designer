import type { UnitEditorAddon } from './UnitPropertyEditorConfig.js';

const popupSize = 108;
const angleUnitInDegrees: Record<string, number> = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 };

function getAngle(event: PointerEvent, circle: HTMLElement) {
  const rect = circle.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  return (Math.atan2(-y, x) * 180 / Math.PI + 360) % 360;
}

export function getAngleInDegrees(value?: string | null) {
  const match = value?.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*([a-z]+)?$/i);
  if (!match)
    return 0;
  const angle = Number(match[1]) * (angleUnitInDegrees[match[2]?.toLowerCase() ?? 'deg'] ?? 1);
  return Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0;
}

/** Creates the built-in circular picker used by CSS angle properties. */
export const createAngleUnitEditorAddon: UnitEditorAddon = context => {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = 'Pick angle';
  button.setAttribute('aria-label', 'Pick angle');
  button.textContent = '◉';
  button.style.cssText = 'border:0;background:transparent;color:inherit;cursor:pointer;padding:0 3px;height:24px;line-height:1;';
  if (context.property.readonly) {
    button.disabled = true;
    button.style.cursor = 'default';
    return button;
  }

  let popup: HTMLDivElement | null = null;
  let circle: HTMLDivElement | null = null;
  let dragging = false;
  let cancelOnBlur: () => void;

  const updateHand = (angle: number) => {
    const hand = popup?.querySelector<HTMLElement>('[data-angle-hand]');
    if (hand)
      hand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  };
  const selectAngle = async (event: PointerEvent, commit: boolean) => {
    if (!circle)
      return;
    const angle = Math.round(getAngle(event, circle));
    updateHand(angle);
    const value = `${angle}deg`;
    if (commit)
      await context.setValue(value);
    else
      await context.previewValue(value);
  };
  const close = async (removePreview = false) => {
    if (removePreview)
      await context.removePreviewValue();
    popup?.remove();
    popup = null;
    circle = null;
    dragging = false;
    document.removeEventListener('pointerdown', outsidePointerDown, true);
    window.removeEventListener('blur', cancelOnBlur);
  };
  const outsidePointerDown = (event: PointerEvent) => {
    if (popup && !popup.contains(event.target as Node) && event.target !== button)
      void close(dragging);
  };
  const open = () => {
    if (popup) {
      void close(dragging);
      return;
    }
    popup = document.createElement('div');
    popup.style.cssText = `position:fixed;z-index:100000;width:${popupSize}px;height:${popupSize}px;border:2px solid currentColor;border-radius:50%;background:var(--property-editor-popup-background,#fff);color:var(--property-editor-popup-color,#111);box-sizing:border-box;`;
    circle = popup;
    const labels = [['0', 'right'], ['90', 'top'], ['180', 'left'], ['270', 'bottom']];
    for (const [label, position] of labels) {
      const item = document.createElement('span');
      item.textContent = label;
      item.style.cssText = `position:absolute;font:10px sans-serif;${position}:4px;${position === 'right' || position === 'left' ? 'top:50%;transform:translateY(-50%);' : 'left:50%;transform:translateX(-50%);'}`;
      popup.appendChild(item);
    }
    const hand = document.createElement('span');
    hand.dataset.angleHand = '';
    hand.style.cssText = `position:absolute;left:50%;top:50%;width:42%;height:2px;background:#f22;transform-origin:0 50%;transform:rotate(${getAngleInDegrees(context.value)}deg);`;
    popup.appendChild(hand);
    document.body.appendChild(popup);
    const rect = button.getBoundingClientRect();
    popup.style.left = `${Math.max(4, rect.right - popupSize)}px`;
    popup.style.top = `${rect.bottom + 4}px`;
    circle.addEventListener('pointerdown', event => { dragging = true; circle!.setPointerCapture?.(event.pointerId); void selectAngle(event, false); });
    circle.addEventListener('pointermove', event => { if (dragging) void selectAngle(event, false); });
    circle.addEventListener('pointerup', event => { if (dragging) { dragging = false; void selectAngle(event, true); } });
    circle.addEventListener('pointercancel', () => { if (dragging) void close(true); });
    cancelOnBlur = () => { if (dragging) void close(true); };
    window.addEventListener('blur', cancelOnBlur);
    document.addEventListener('pointerdown', outsidePointerDown, true);
  };
  button.addEventListener('click', open);
  return button;
};
