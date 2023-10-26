import { Oscillator } from "./oscillatori";

export class OscillatorUseSetInterval implements Oscillator {
    constructor(private readonly window: Window) { }

    private count = 0;
    private startTime = new Date();

    private lastWatchTotalCount = 0;
    private lastWatch = new Date();

    private frameIId = 0;
    private watchIId = 0;

    public start(fps: number, cbOneFrame: () => void,
        cbForIndicate: (nowFps: number, count: number) => void) {
        if (this.isStarted()) return;

        this.count = 0;
        this.startTime = new Date();
        this.lastWatchTotalCount = 0;
        this.lastWatch = this.startTime;

        const idealIntervalMs = 1000 / fps;

        this.frameIId = window.setInterval(() => this.frameProcess(cbOneFrame), idealIntervalMs);
        this.watchIId = window.setInterval(() => this.watchProcess(cbForIndicate), 1000);
    }

    public stop() {
        if (!this.isStarted()) return;

        window.clearInterval(this.frameIId);
        window.clearInterval(this.watchIId);
        this.frameIId = 0;
        this.watchIId = 0;
    }

    public isStarted(): boolean {
        return this.frameIId !== 0;
    }

    private frameProcess(cbOneFrame: () => void) {
        this.count++;
        cbOneFrame();
    }

    private watchProcess(cbForIndicate: (nowFps: number, count: number) => void) {
        const now = new Date();
        const nowIntervalCount = this.count - this.lastWatchTotalCount;
        const intavalMs = now.getTime() - this.lastWatch.getTime();
        const fps = nowIntervalCount / intavalMs * 1000;

        this.lastWatchTotalCount = this.count;
        this.lastWatch = now;

        cbForIndicate(fps, this.count);
    }
}