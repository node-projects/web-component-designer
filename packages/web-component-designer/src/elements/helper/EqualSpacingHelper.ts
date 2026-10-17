import type { IRect } from '../../interfaces/IRect.js';

export interface EqualSpacingSnap {
    position: number;
    gaps: [number, number][];
    crossPosition: number;
}

// Compare adjacent elements in the same row/column. Coordinates are canvas units.
export function getEqualSpacingSnap(rect: IRect, neighbours: IRect[], horizontal: boolean, maxDistance: number): EqualSpacingSnap | undefined {
    const axis = horizontal ? 'x' : 'y';
    const size = horizontal ? 'width' : 'height';
    const cross = horizontal ? 'y' : 'x';
    const crossSize = horizontal ? 'height' : 'width';
    // Container bounds must not mask the gaps between their children.
    const peers = neighbours.filter(x => !neighbours.some(other => x !== other &&
        x.x <= other.x && x.y <= other.y && x.x + x.width >= other.x + other.width && x.y + x.height >= other.y + other.height &&
        (x.width > other.width || x.height > other.height)));
    const items = peers.filter(x => x[size] > 0 && x[crossSize] > 0 &&
        Math.max(x[cross], rect[cross]) < Math.min(x[cross] + x[crossSize], rect[cross] + rect[crossSize]))
        .sort((a, b) => a[axis] - b[axis]);
    let result: EqualSpacingSnap;
    for (let i = 1; i < items.length; i++) {
        const a = items[i - 1];
        const b = items[i];
        const crossStart = Math.max(a[cross], b[cross], rect[cross]);
        const crossEnd = Math.min(a[cross] + a[crossSize], b[cross] + b[crossSize], rect[cross] + rect[crossSize]);
        if (crossStart >= crossEnd)
            continue;
        const endA = a[axis] + a[size];
        const gap = b[axis] - endA;
        if (gap < 0)
            continue;
        const middleGap = (gap - rect[size]) / 2;
        const candidates: EqualSpacingSnap[] = [
            { position: a[axis] - gap - rect[size], gaps: [[a[axis] - gap, a[axis]], [endA, b[axis]]], crossPosition: (crossStart + crossEnd) / 2 },
            { position: b[axis] + b[size] + gap, gaps: [[endA, b[axis]], [b[axis] + b[size], b[axis] + b[size] + gap]], crossPosition: (crossStart + crossEnd) / 2 }
        ];
        if (middleGap >= 0)
            candidates.push({ position: endA + middleGap, gaps: [[endA, endA + middleGap], [endA + middleGap + rect[size], b[axis]]], crossPosition: (crossStart + crossEnd) / 2 });
        for (const candidate of candidates) {
            const start = Math.min(candidate.position, a[axis]);
            const end = Math.max(candidate.position + rect[size], b[axis] + b[size]);
            if (items.some(x => x !== a && x !== b && x[axis] < end && x[axis] + x[size] > start))
                continue;
            const distance = Math.abs(candidate.position - rect[axis]);
            if (distance <= maxDistance && (!result || distance < Math.abs(result.position - rect[axis])))
                result = candidate;
        }
    }
    return result;
}
