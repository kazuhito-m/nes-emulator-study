export class Sprite {
    constructor(
        public patternTableIdx = 0,
        public attribute = 0,
        public x = 0,
        public y = 0,
    ) { }

    public static readonly SIZE = 4;
}