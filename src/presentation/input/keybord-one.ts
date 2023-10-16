import { Dispatch, SetStateAction } from "react";
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

    public registerKeyEvents(window: Window, changeFunc: Dispatch<SetStateAction<PadInput>>) {
        const document = window.document;
        document.onkeydown = (e) =>  this.changeKeyState(e.key, true, changeFunc);
        document.onkeyup = (e) => this.changeKeyState(e.key, false, changeFunc);
        window.onblur = () => this.clearStates(changeFunc);
        window.onfocus = () => this.clearStates(changeFunc);
    }

    private async changeKeyState(key: string, state: boolean, changeFunc: Dispatch<SetStateAction<PadInput>>): void {
        console.log('key:"' + key + '", state:' + state);
        switch (key.toLowerCase()) {
            case 'arrowup':
                this.up = state;
                break;
            case 'arrowdown':
                this.down = state;
                break;
            case 'arrowleft':
                this.left = state;
                break;
            case 'arrowright':
                this.right = state;
                break;
            case 'a':
                this.a = state;
                break;
            case 'b':
                this.b = state;
                break;
            case 'l':
                this.select = state;
                break;
            case 'r':
                this.start = state;
                break;
            default:
                break;
        }
        console.log(JSON.stringify(this));
        changeFunc(this.duplicateStateOnly());
    }

    private clearStates(changeFunc: Dispatch<SetStateAction<PadInput>>): void {
        console.log('clear input.');
        const o: any = this;
        for (const name in o) if (typeof o[name] === 'boolean') o[name] = false;
        console.log(JSON.stringify(this));
        changeFunc(this.duplicateStateOnly());
    }

    public duplicateStateOnly(): PadInput {
        return {
            up: this.up,
            down: this.down,
            left: this.left,
            right: this.right,
            a: this.a,
            b: this.b,
            select: this.select,
            start: this.start
        }
    }
}
