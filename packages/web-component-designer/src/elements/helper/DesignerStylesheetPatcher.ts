export interface IDesignerStylesheetPatchAttributes {
  forceHoverAttributeName: string;
  forceActiveAttributeName: string;
  forceVisitedAttributeName: string;
  forceFocusAttributeName: string;
  forceFocusWithinAttributeName: string;
  forceFocusVisibleAttributeName: string;
}

export function patchStylesheetSelectorForDesigner(text: string, attributes: IDesignerStylesheetPatchAttributes) {
  return text
    .replaceAll(/:root\b/g, ':host')
    .replaceAll(':focus-within', '[' + attributes.forceFocusWithinAttributeName + ']')
    .replaceAll(':focus-visible', '[' + attributes.forceFocusVisibleAttributeName + ']')
    .replaceAll(':hover', '[' + attributes.forceHoverAttributeName + ']')
    .replaceAll(':active', '[' + attributes.forceActiveAttributeName + ']')
    .replaceAll(':visited', '[' + attributes.forceVisitedAttributeName + ']')
    .replaceAll(':focus', '[' + attributes.forceFocusAttributeName + ']');
}
