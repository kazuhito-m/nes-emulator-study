export function memcpy(dist: number[], src: number[], size: number): void {
    for (let i = 0; i < size; i++) dist[i] = src[i];
}