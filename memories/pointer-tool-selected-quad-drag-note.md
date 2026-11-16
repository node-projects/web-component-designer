# Pointer-tool drag source

- Pointer handling distinguishes the clicked item from the drag source. After Alt-selecting an obscured element, a plain click can still select the topmost hit item.
- A plain drag may move the selected underlying item when the pointer is inside its border quad. Recompute the initial drag offset from the chosen drag source.
- Prepare snaplines on the first pointer movement with the button held, after resolving the drag selection. A selection-only mouse-down must not scan page geometry, and read-only interactions do not prepare drag snapping.
- Tools may return a known target through `getElementForPointerEvent`; undefined retains normal hit testing. The pointer tool reuses the mouse-down item only for an uninterrupted plain mouse-up, matching its existing click-selection behavior. Drag, modifier and root-selection paths keep hit testing.
