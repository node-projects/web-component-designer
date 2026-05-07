# Unified geometry click selection

`UnifiedGeometryExtension` creates drag state on handle pointer-down so it can keep pointer capture and support immediate dragging. A plain click on a handle must not commit geometry on pointer-up. Track `geometryChanged` in the drag state, set it only after a non-zero pointer movement has updated geometry, and commit on pointer-up only when that flag is true.
