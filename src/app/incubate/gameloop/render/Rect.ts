import { Color } from "@/domain/model/emulator/color";

export class Rect {
    constructor(
        private readonly x: number,
        private readonly y: number,
        private w: number,
        private readonly h: number,
        private readonly retio: number,
        public readonly color: Color
    ) { }

    public renewExpandSideways(): Rect {
        return new Rect(
            this.x,
            this.y,
            this.w + 1,
            this.h,
            this.retio,
            this.color
        );
    }

    public expandSideways(): void {
        this.w++;
    }

    public calcX(): number { return this.x * this.retio; }
    public calcY(): number { return this.y * this.retio; }
    public calcW(): number { return this.w * this.retio; }
    public calcH(): number { return this.h * this.retio; }

    public colorTextOfFillStyle(): string {
        const c = this.color;
        return `rgb(${c.Red} ${c.Green} ${c.Blue})`;
    }

    public static dotOf = (
        x: number,
        y: number,
        retio: number,
        color: Color
    ) => new Rect(x, y, 1, 1, retio, color);
}
