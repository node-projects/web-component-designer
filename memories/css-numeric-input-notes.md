# CSS numeric input

- Converting a rendered size to `%` prefers the element's measured `getBoundingClientRect()` size so changing units preserves the visual size. `%` to pixels continues to use the normal reference-size calculation.
- Percentage reference lookup crosses shadow boundaries through `getRootNode().host`, then falls back to `body` or `documentElement` for root elements.
- `NumericStyleInput` owns its preview display lock. It clears the lock when a genuinely different underlying value arrives and keeps it across repeated stale refreshes during a preview.
- Scrubbing uses window-level pointer move/up/cancel listeners. Drag and step interactions snap to the configured step and format to its precision.
