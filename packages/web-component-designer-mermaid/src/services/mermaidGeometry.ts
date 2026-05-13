export type Point = {
    x: number;
    y: number;
}

export type Rect = Point & {
    width: number;
    height: number;
}

export type FlowchartDirection = "TB" | "TD" | "BT" | "RL" | "LR";

export function encodeWaypoints(waypoints: Point[]) {
    return waypoints.map(point => `${Math.round(point.x)},${Math.round(point.y)}`).join(" ");
}

export function decodeWaypoints(value: string) {
    if (!value)
        return [];

    return value.split(/\s+/).map(part => {
        const [x, y] = part.split(",").map(Number);
        return { x, y };
    }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
}

export function boundsFromWaypoints(waypoints: Point[]) {
    const xs = waypoints.map(point => point.x);
    const ys = waypoints.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function pathDataFromWaypoints(waypoints: Point[]) {
    if (!waypoints.length)
        return "";

    return waypoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function midpointFromWaypoints(waypoints: Point[]) {
    if (!waypoints.length)
        return { x: 0, y: 0 };
    if (waypoints.length === 1)
        return waypoints[0];

    const segmentLengths: number[] = [];
    let totalLength = 0;
    for (let i = 1; i < waypoints.length; i++) {
        const length = distance(waypoints[i - 1], waypoints[i]);
        segmentLengths.push(length);
        totalLength += length;
    }

    let remaining = totalLength / 2;
    for (let i = 1; i < waypoints.length; i++) {
        const segmentLength = segmentLengths[i - 1];
        if (remaining <= segmentLength) {
            const ratio = segmentLength === 0 ? 0 : remaining / segmentLength;
            return {
                x: waypoints[i - 1].x + (waypoints[i].x - waypoints[i - 1].x) * ratio,
                y: waypoints[i - 1].y + (waypoints[i].y - waypoints[i - 1].y) * ratio,
            };
        }
        remaining -= segmentLength;
    }

    return waypoints[waypoints.length - 1];
}

export function routeBetweenBounds(source: Rect, target: Rect, direction?: FlowchartDirection) {
    const sourceCenter = center(source);
    const targetCenter = center(target);
    if (direction === "LR" || direction === "RL")
        return [getHorizontalAnchor(source, targetCenter), getHorizontalAnchor(target, sourceCenter)];
    if (direction === "TD" || direction === "TB" || direction === "BT")
        return [getVerticalAnchor(source, targetCenter), getVerticalAnchor(target, sourceCenter)];
    return [getAnchor(source, targetCenter), getAnchor(target, sourceCenter)];
}

export function routeBetweenPoints(source: Point, target: Point) {
    return [source, target];
}

export function getAnchor(rect: Rect, target: Point) {
    const c = center(rect);
    const dx = target.x - c.x;
    const dy = target.y - c.y;

    if (Math.abs(dx / rect.width) > Math.abs(dy / rect.height)) {
        return {
            x: dx >= 0 ? rect.x + rect.width : rect.x,
            y: c.y,
        };
    }

    return {
        x: c.x,
        y: dy >= 0 ? rect.y + rect.height : rect.y,
    };
}

function center(rect: Rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}

function getHorizontalAnchor(rect: Rect, target: Point) {
    const c = center(rect);
    return {
        x: target.x >= c.x ? rect.x + rect.width : rect.x,
        y: c.y,
    };
}

function getVerticalAnchor(rect: Rect, target: Point) {
    const c = center(rect);
    return {
        x: c.x,
        y: target.y >= c.y ? rect.y + rect.height : rect.y,
    };
}

function distance(a: Point, b: Point) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}
