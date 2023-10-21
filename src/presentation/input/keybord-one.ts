import { PadInput } from "./pad-input";

export class KeyboardOne implements PadInput {
    constructor(
        public up: boolean = false,
        public down: boolean = false,
        public left: boolean = false,
        public right: boolean = false,
        public a: boolean = false,
        public b: boolean = false,
        public select: boolean = false,
        public start: boolean = false
    ) { }
}
