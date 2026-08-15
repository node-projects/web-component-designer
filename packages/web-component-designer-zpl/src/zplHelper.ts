export function getZplCoordinates(obj: any, alignment: 0|1|2, xOffset = 0, yOffset = 0) {
    let x = obj.style.left.replace("px", "");
    let y= obj.style.top.replace("px", "");
    if (xOffset) x = String((Number(x) || 0) + xOffset);
    if (yOffset) y = String((Number(y) || 0) + yOffset);
    return "^FO" + x + "," + y + "," + alignment;
}
