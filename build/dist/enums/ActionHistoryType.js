export var ActionHistoryType;

(function (ActionHistoryType) {
  ActionHistoryType["Update"] = "update";
  ActionHistoryType["New"] = "new";
  ActionHistoryType["Delete"] = "delete";
  ActionHistoryType["Fit"] = "fit";
  ActionHistoryType["Move"] = "move";
  ActionHistoryType["Resize"] = "resize";
  ActionHistoryType["Reparent"] = "reparent";
  ActionHistoryType["MoveUp"] = "move-up";
  ActionHistoryType["MoveDown"] = "move-down";
  ActionHistoryType["MoveBack"] = "move-back";
  ActionHistoryType["MoveForward"] = "move-forward";
})(ActionHistoryType || (ActionHistoryType = {}));