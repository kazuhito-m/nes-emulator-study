export class MeasuringStopwatch {
    private startTime?: Date;
    private stopTime?: Date;
    private latestSamplesMs: number[];
    private totalMeasureTimeMs = 0;
    private totalMeasureCount = 0;
    private nowMesureingStartMs = 0;

    private now = (): number => performance.now();

    constructor(
        private readonly numberOfSmaples: number
    ) {
        this.latestSamplesMs = Array<number>();
        this.clear();
    }

    public start(): void {
        if (!this.startTime) this.startTime = new Date();

        this.nowMesureingStartMs = this.now();

        this.stopTime = undefined;
    }

    public stop(): number {
        if (this.nowMesureingStartMs === 0) return 0;

        const timeMs = this.now() - this.nowMesureingStartMs;
        this.regsiter(timeMs);

        this.totalMeasureTimeMs += timeMs;
        this.totalMeasureCount++;

        this.stopTime = new Date();
        return timeMs;
    }

    public averageMs(): number {
        const samples = this.latestSamplesMs;
        const total = samples.reduce((left, right) => left + right);
        return total / samples.length;
    }

    public median(): number {
        const samples = this.latestSamplesMs;
        const half = Math.floor(samples.length / 2);
        return samples.sort()[half];
    }

    public clear(): void {
        this.startTime = undefined;
        this.stopTime = undefined;
        this.latestSamplesMs = Array<number>();
        this.totalMeasureTimeMs = 0;
        this.totalMeasureCount = 0;
        this.nowMesureingStartMs = 0;
    }

    // private methods

    private regsiter(sample: number): void {
        if (this.latestSamplesMs.length < this.numberOfSmaples)
            this.latestSamplesMs.push(sample);
        else
            this.latestSamplesMs[this.totalMeasureCount % this.numberOfSmaples];
    }

    // accessor

    public getLatestMeasurementsMs(): readonly number[] {
        return Object.freeze(this.latestSamplesMs.concat());
    }

    public getTotalMeasureTimeMs(): number {
        return this.totalMeasureTimeMs;
    }
}
