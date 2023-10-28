import { Oscillator } from "../oscillatori";
import { LoopOfRequestAnimationFrame } from "./loop-of-request-animation-frame";

export class OscillatorUseRequestAnimationFrame implements Oscillator {
    constructor(private readonly window: Window) { }

    private count = 0;
    private startTime = new Date();

    private lastWatchTotalCount = 0;
    private lastWatch = new Date();

    private watchIId = 0;

    private loop?: LoopOfRequestAnimationFrame;

    public start(fps: number, cbOneFrame: () => void,
        cbForIndicate: (nowFps: number, count: number) => void) {
        if (this.isStarted()) return;

        this.count = 0;
        this.startTime = new Date();
        this.lastWatchTotalCount = 0;
        this.lastWatch = this.startTime;

        const idealIntervalMs = 1000 / fps;

        this.loop = new LoopOfRequestAnimationFrame(() => this.frameProcess(cbOneFrame), this.window);
        this.loop.start();

        this.watchIId = window.setInterval(() => this.watchProcess(cbForIndicate), 1000);
    }

    public stop() {
        if (!this.isStarted()) return;

        this.loop?.stop();
        this.loop = undefined;

        window.clearInterval(this.watchIId);
        this.watchIId = 0;
    }

    public isStarted(): boolean {
        return this.watchIId !== 0;
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