export function memcpy(dist: number[], src: number[], size: number): void {
    for (let i = 0; i < size; i++) dist[i] = src[i];
}

export function initializeTwoDimensionalArray<T extends string | number | boolean>(d1: number, d2: number): T[][] {
    const result = new Array(d1);
    for (let i = 0; i < d1; i++) result[i] = new Array(d2).fill(0);
    return result;
}

export function max(left: number, right: number): number {
    return left > right ? left : right;
}

export function min(left: number, right: number): number {
    return left < right ? left : right;
}
