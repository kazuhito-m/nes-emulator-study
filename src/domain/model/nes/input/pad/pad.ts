export enum PadButton {
    A,
    B,
    SELECT,
    START,
    UP,
    DOWN,
    LEFT,
    RIGHT
}

export enum PadId {
    Zero = 0,
    One
}

enum BitOfButton {
    BUTTON_A = 1,
    BUTTON_B = 2,
    BUTTON_SELECT = 4,
    BUTTON_START = 8,
    BUTTON_UP = 16,
    BUTTON_DOWN = 32,
    BUTTON_LEFT = 64,
    BUTTON_RIGHT = 128,
}

export class Pad {
    constructor(
        private m_IsStrobeEnable = true,
        private m_ButtonStatus = 0,
        private m_ReadIdx = 0
    ) { }

    public pushButton(button: PadButton): void {
        switch (button) {
            case PadButton.A:
                this.m_ButtonStatus |= BitOfButton.BUTTON_A;
                break;
            case PadButton.B:
                this.m_ButtonStatus |= BitOfButton.BUTTON_B;
                break;
            case PadButton.SELECT:
                this.m_ButtonStatus |= BitOfButton.BUTTON_SELECT;
                break;
            case PadButton.START:
                this.m_ButtonStatus |= BitOfButton.BUTTON_START;
                break;
            case PadButton.UP:
                this.m_ButtonStatus |= BitOfButton.BUTTON_UP;
                break;
            case PadButton.DOWN:
                this.m_ButtonStatus |= BitOfButton.BUTTON_DOWN;
                break;
            case PadButton.LEFT:
                this.m_ButtonStatus |= BitOfButton.BUTTON_LEFT;
                break;
            case PadButton.RIGHT:
                this.m_ButtonStatus |= BitOfButton.BUTTON_RIGHT;
                break;
            default:
                break;
        }
    }

    public releaseButton(button: PadButton): void {
        switch (button) {
            case PadButton.A:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_A;
                break;
            case PadButton.B:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_B;
                break;
            case PadButton.SELECT:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_SELECT;
                break;
            case PadButton.START:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_START;
                break;
            case PadButton.UP:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_UP;
                break;
            case PadButton.DOWN:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_DOWN;
                break;
            case PadButton.LEFT:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_LEFT;
                break;
            case PadButton.RIGHT:
                this.m_ButtonStatus &= ~BitOfButton.BUTTON_RIGHT;
                break;
            default:
                break;
        }
    }

    // 1回読みだすたびに読みだすインデックスをずらす
    public readPad(): number {
        const ret = (this.m_ButtonStatus >> this.m_ReadIdx) & 1;

        if (this.m_IsStrobeEnable) return ret;
        // strobe disabled なときだけ次以降の入力がよめる
        this.m_ReadIdx++;
        this.m_ReadIdx %= 8;

        return ret;
    }

    public setStrobe(flag: boolean): void {
        this.m_IsStrobeEnable = flag;
        if (flag) this.m_ReadIdx = 0;
    }
}
