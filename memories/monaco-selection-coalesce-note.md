# Monaco selection coalescing

When designer selection changes are mirrored into split/code view, the same source range can be requested more than once around a designer content update. `DocumentContainer` now coalesces identical source-range selections before calling the active code view.

`CodeViewMonaco` also tracks the delayed native Monaco selection call. Pending identical selections are ignored, and pending delayed selections are cleared when the model is updated, so a selection queued against the old model is not applied after the refreshed model and followed by the same fresh selection.
