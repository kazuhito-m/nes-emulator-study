export class Color {
    constructor(
        public readonly Red: number,
        public readonly Green: number,
        public readonly Blue: number,
    ) { }

    public static readonly BLACK = new Color(0, 0, 0);

    public equals(other: Color): boolean {
        return this.Red === other.Red
            && this.Green === other.Green
            && this.Blue === other.Blue;
    }
}
