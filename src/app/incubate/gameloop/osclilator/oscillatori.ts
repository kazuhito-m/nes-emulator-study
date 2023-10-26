export interface Oscillator {
    start(fps: number, cbOneFrame: () => void,
        cbForIndicate: (nowFps: number, count: number) => void): void;
    stop(): void;
    isStarted(): boolean;
}