# Overlay refresh pattern

- Designer extensions should pass existing SVG nodes back into `_drawLine`, `_drawCircle`, and `_drawPath`, and gate refresh work with `_valuesHaveChanges`.
- Rebuild overlays only when their structure changes, such as segment count/type or control-point presence. Updating existing nodes preserves pointer capture and avoids stale handles.
