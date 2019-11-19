export var UndoItemType;

(function (UndoItemType) {
  UndoItemType["Update"] = "update";
  UndoItemType["New"] = "new";
  UndoItemType["Delete"] = "delete";
  UndoItemType["Fit"] = "fit";
  UndoItemType["Move"] = "move";
  UndoItemType["Resize"] = "resize";
  UndoItemType["Reparent"] = "reparent";
  UndoItemType["MoveUp"] = "move-up";
  UndoItemType["MoveDown"] = "move-down";
  UndoItemType["MoveBack"] = "move-back";
  UndoItemType["MoveForward"] = "move-forward";
})(UndoItemType || (UndoItemType = {}));