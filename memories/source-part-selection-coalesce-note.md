When selecting a source part on a design item that may not already be primary,
pass the source part into `selectionService.setSelectedElements(..., sourcePart)`
instead of calling `setSelectedElements()` and then `setSelectedPart()`. Splitting
those calls emits two code-view selections (element range, then source-part range)
and makes the text editor jump.
