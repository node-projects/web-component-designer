import type { ISize } from '@node-projects/web-component-designer';

export const quantizeZplValue = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(value)));

export const zplAxisScales = (rotation: string | null, initial: ISize, current: ISize) => {
    const screenWidth = current.width / Math.max(1, initial.width);
    const screenHeight = current.height / Math.max(1, initial.height);
    return ['R', 'B'].includes(rotation ?? 'N')
        ? { width: screenHeight, height: screenWidth }
        : { width: screenWidth, height: screenHeight };
};
