export type SvgStrokeStyle = 'stroke-dasharray' | 'stroke-linecap' | 'stroke-linejoin';
export interface SvgStrokeStyleControl { element: HTMLElement; setValue(value: string): void; }

/** Visual stroke presets shared by the drawing popup and geometry toolbar. */
export function createSvgStrokeStyleControl(property: SvgStrokeStyle, changed: (value: string) => void): SvgStrokeStyleControl {
  const choices = property === 'stroke-dasharray'
    ? [['none', 'Solid stroke'], ['4 4', 'Dashed stroke'], ['1 3', 'Dotted stroke'], ['8 3 1 3', 'Dash-dot stroke']]
    : property === 'stroke-linecap'
      ? [['butt', 'Butt cap'], ['round', 'Round cap'], ['square', 'Square cap']]
      : [['miter', 'Miter join'], ['round', 'Round join'], ['bevel', 'Bevel join']];
  const group = document.createElement('span');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', property === 'stroke-dasharray' ? 'Stroke dash' : property === 'stroke-linecap' ? 'Stroke cap' : 'Stroke join');
  group.style.cssText = 'display:inline-flex;gap:1px;vertical-align:middle';
  const buttons = choices.map(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.title = label;
    button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', 'false');
    button.style.cssText = 'width:29px;height:26px;padding:2px;border:1px solid var(--wcd-color-border,#888);border-radius:3px;color:inherit;cursor:pointer';
    const path = property === 'stroke-dasharray'
      ? `<path d="M2 12H26" stroke-width="2" stroke-dasharray="${value}"/>`
      : property === 'stroke-linecap'
        ? `<path d="M7 12H21" stroke-width="7" stroke-linecap="${value}"/><path d="M7 3V21M21 3V21" stroke-width=".6" stroke="var(--wcd-color-selection,#3899ec)"/>`
        : `<path d="M5 20 14 5 23 20" stroke-width="6" stroke-linejoin="${value}"/>`;
    button.innerHTML = `<svg viewBox="0 0 28 24" width="24" height="20" aria-hidden="true" fill="none" stroke="currentColor" style="display:block;pointer-events:none">${path}</svg>`;
    button.onclick = event => { event.stopPropagation(); changed(value); };
    group.append(button);
    return button;
  });
  return { element: group, setValue(value) {
    buttons.forEach((button, index) => {
      const active = choices[index][0] === value;
      button.setAttribute('aria-pressed', String(active));
      button.style.background = active ? 'var(--wcd-designer-view-tool-selected-background,#a8d7ff)' : 'transparent';
    });
  } };
}
