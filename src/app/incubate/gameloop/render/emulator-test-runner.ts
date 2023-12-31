import { Rect } from "./rect";
import { Color } from "@/domain/model/emulator/color";
import { Emulator } from "@/domain/model/emulator/emulator";
import { Constants } from "@/domain/model/nes/constants";
import { MeasuringStopwatch } from "@/domain/model/measur/measuring-stopwatch";

export class EmulatorTestRunner {
    private emulator: Emulator;

    public static readonly STOPWATCH_SAMPLE_COUNT = 100;

    constructor(
        private readonly canvas: HTMLCanvasElement,
        testRomBinary: number[],
    ) {
        this.emulator = new Emulator(testRomBinary, testRomBinary.length, (v) => { });

        this.clearCanvasOf(this.generateEmptyColorMatrix(),
            canvas.getContext("2d") as CanvasRenderingContext2D,
            EmulatorTestRunner.DISPLAY_RATIO);
    }

    public readonly emulatorStopwatch = new MeasuringStopwatch(EmulatorTestRunner.STOPWATCH_SAMPLE_COUNT);
    public readonly renderStopwatch = new MeasuringStopwatch(EmulatorTestRunner.STOPWATCH_SAMPLE_COUNT);

    private static readonly DISPLAY_RATIO = 2;  // canvasのサイズはドット数の2倍pixelであること決め打ち。

    public stepFrame(): void {
        const emu = this.emulator;

        const matrix = this.generateEmptyColorMatrix();

        this.emulatorStopwatch.start();
        emu.stepFrame();
        emu.getPictureColor(matrix);
        this.emulatorStopwatch.stop();

        // matrix.forEach(i => console.log(i.map(j => `[${j.Red},${j.Green},${j.Blue}]`).join('')));

        this.renderStopwatch.start();
        this.rendering(matrix, EmulatorTestRunner.DISPLAY_RATIO);
        this.renderStopwatch.stop();

        // console.log(`${this.emulatorStopwatch.getTotalMeasureCount()} 回目のフレーム処理完了。`);
    }

    private rendering(matrix: Color[][], ratio: number): CanvasRenderingContext2D {
        const canvas = this.canvas;
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;

        this.renderCanvasOf(matrix, context, ratio);

        return context;
    }

    private renderCanvasOf(
        matrix: Color[][],
        context: CanvasRenderingContext2D,
        ratio: number
    ): void {
        const totalSize = matrix.length * ratio;

        let debugValueCount = 0;

        const rects: Rect[] = [];

        for (let y = 0; y < matrix.length; y++) {
            const line = matrix[y];

            let rect: Rect | null = null;

            for (let x = 0; x < line.length; x++) {
                debugValueCount++;

                const color = line[x];
                if (rect === null) {
                    rect = Rect.dotOf(x, y, ratio, color);
                } else {
                    if (rect.color.equals(color)) {
                        rect.expandSideways();
                    } else {
                        rects.push(rect);
                        rect = Rect.dotOf(x, y, ratio, color);
                    }
                }
            }

            if (rect !== null) rects.push(rect);
        }

        // console.log("rect:" + rects.length + ", valueCount:" + debugValueCount);

        this.clearCanvasOf(matrix, context, ratio);

        context.beginPath();
        for (const rect of rects) {
            context.fillStyle = rect.colorTextOfFillStyle();
            context.fillRect(rect.calcX(), rect.calcY(), rect.calcW(), rect.calcH());
        }
    }

    private generateEmptyColorMatrix(): Color[][] {
        const result = new Array(Constants.PPU_OUTPUT_Y);
        for (let i = 0; i < result.length; i++) result[i] = new Array(Constants.PPU_OUTPUT_X).fill(Color.BLACK);
        return result;
    }

    private clearCanvasOf(matrix: Color[][], context: CanvasRenderingContext2D, ratio: number): void {
        const height = matrix.length * ratio;
        const width = matrix[0].length * ratio;
        context.clearRect(0, 0, width, height);
    }
}
