# Pointer-tool drag source

- Pointer handling distinguishes the clicked item from the drag source. After Alt-selecting an obscured element, a plain click can still select the topmost hit item.
- A plain drag may move the selected underlying item when the pointer is inside its border quad. Recompute the initial drag offset from the chosen drag source.
