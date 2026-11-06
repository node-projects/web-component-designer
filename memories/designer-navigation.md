# Designer navigation

DesignerView converts wheel pixel/line/page units into screen distances. Pan
translation must not depend on the design surface's dimensions or zoom. Ctrl+wheel
and touchpad pinch scale proportionally around the pointer. Browser pinch wheel
deltas encode `-100 * log(scale)`; apply scale and translation together once per
frame without easing or a post-gesture tail. Limit coarse zoom deltas. Entering a
pinch cancels unfinished panning so it starts from the painted view. Scrollable
shapes must not intercept Ctrl+wheel as content scrolling. Respect reduced motion
for pan easing and cancel pending wheel animation on pointerdown, external canvas
navigation, document detachment and disconnection.
Toolbar zoom steps are proportional too, with finer steps during a held press.
Panning alone retains smoothing; zoom direction reversals take effect next frame.

Scrollbar arrows use screen distances, track clicks use the visible viewport,
and thumb sizes reflect the viewport/navigation range. Keep scrollbar dragging
direct and preserve the untouched axis. The existing symmetric workspace range
allows panning around the design surface. Update thumb geometry after resizing.

DesignerCanvas.setViewport applies zoom and translation together with one
transform/geometry refresh and notification. Use it when both values change.

Run `node --test packages/web-component-designer/tests/DesignerNavigation.browser.mjs`
for browser input, painted geometry, anchoring and cancellation checks. Existing
`DesignerZoom.test.ts` retains centered toolbar zoom and button-repeat coverage.
