export function getZplCoordinates(obj: any, alignment: 0|1|2) {
    let x = obj.style.left.replace("px", "");
    let y= obj.style.top.replace("px", "");
    return "^FO" + x + "," + y + "," + alignment;
}
