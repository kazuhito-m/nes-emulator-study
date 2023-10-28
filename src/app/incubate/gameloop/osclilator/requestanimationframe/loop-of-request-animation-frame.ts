export class LoopOfRequestAnimationFrame {
    constructor(
        private targetProccess: () => void,
        private readonly window: Window
    ) { }

    private inLooping = false;
    private nowRequestId: number = 0;

    public start(): void {
        if (this.inLooping) return;
        this.inLooping = true;
        this.recursiveCaller();
    }

    public stop(): void {
        if (!this.inLooping) return;
        this.inLooping = false;
        if (this.nowRequestId !== 0) window.cancelAnimationFrame(this.nowRequestId);
        this.nowRequestId = 0;
    }

    private recursiveCaller() {
        if (!this.inLooping) return;
        this.targetProccess();
        this.nowRequestId = window.requestAnimationFrame(() => this.recursiveCaller());
    }
}
