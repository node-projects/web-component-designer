import { isAppleDevice } from "./Helper.js";

export function hasCommandKey(event: KeyboardEvent | MouseEvent | PointerEvent | DragEvent | WheelEvent) {
    if (isAppleDevice())
        return event.metaKey;
    return event.ctrlKey;
}