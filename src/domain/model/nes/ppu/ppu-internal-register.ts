import { PpuInternalRegistertarget } from "./ppu-internal-register-target";

export class PpuInternalRegister {
    constructor(
        // v, t : 15 bit
        private v = 0,
        private t = 0,
        // x: 3 bit
        private x = 0,
        private w = false,
    ) { }

    private static readonly NAMETABLE_SELECT_MASK = 0b000110000000000;
    private static readonly COARSE_X_MASK = 0b000000000011111;
    private static readonly COARSE_Y_MASK = 0b000001111100000;
    private static readonly FINE_Y_MASK = 0b111000000000000;

    public setCoarseX(target: PpuInternalRegistertarget, data: number): void {
        // 下位 5 bit のみ有効
        if ((0b11100000 & data) !== 0) throw new Error('under 5 bit invalid.');

        const mask = PpuInternalRegister.COARSE_X_MASK;
        if (target === PpuInternalRegistertarget.PpuInternalRegistertarget_t) {
            this.t &= ~mask;
            this.t |= data;
        }
        if (target === PpuInternalRegistertarget.PpuInternalRegistertarget_v) {
            this.v &= ~mask;
            this.v |= data;
        }
    }

    public setCoarseY(target: PpuInternalRegistertarget, data: number): void {
        // 下位 5 bit のみ有効
        if ((0b11100000 & data) !== 0) throw new Error('under 5 bit invalid.');

        const writeData = data << 5;
        const mask = PpuInternalRegister.COARSE_Y_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t) {
            this.t &= ~mask;
            this.t |= writeData;
        }
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v) {
            this.v &= ~mask;
            this.v |= writeData;
        }
    }

    public setNametableSelect(target: PpuInternalRegistertarget, data: number): void {
        // 下位 2 bit のみ有効
        if ((0b11111100 & data) !== 0) throw new Error('under 2 bit invalid.');

        const writeData = data << 10;
        const mask = PpuInternalRegister.NAMETABLE_SELECT_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t) {
            this.t &= ~mask;
            this.t |= writeData;
        }
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v) {
            this.v &= ~mask;
            this.v |= writeData;
        }
    }

    public setFineY(target: PpuInternalRegistertarget, data: number): void {
        // 下位 3 bit のみ有効
        if ((0b11111000 & data) !== 0) throw new Error('under 3 bit invalid.');

        const writeData = data << 12;
        const mask = PpuInternalRegister.FINE_Y_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t) {
            this.t &= ~mask;
            this.t |= writeData;
        }
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v) {
            this.v &= ~mask;
            this.v |= writeData;
        }
    }

    public setFineX(data: number): void {
        // 下位 3 bit のみ有効
        if ((0b11111000 & data) !== 0) throw new Error('under 3 bit invalid.');

        this.x = data;
    }

    public setW(data: boolean): void {
        this.w = data;
    }

    // PPUADDR 反映用(紛らわしいけど、 PPUADDR としては使わない、PPUADDR への書き込みと PPUSCROLL への書き込みを混ぜて使ってるゲームのため)
    public setUpperPpuAddr(data: number): void {
        // 上 2 bit をマスクする(https://wiki.nesdev.com/w/index.php/PPU_scrolling#Register_controls)
        data &= 0b00111111;
        const writeData = data << 8;

        this.t &= 0xFF;
        this.t |= writeData;

        this.w = true;
    }

    public setLowerPpuAddr(data: number): void {
        // 下位8bit を更新するだけ
        this.t &= 0xFF00;
        this.t |= data;
        this.v = this.t;

        this.w = false;
    }

    public getCoarseX(target: PpuInternalRegistertarget): number {
        const mask = PpuInternalRegister.COARSE_X_MASK;
        if (target === PpuInternalRegistertarget.PpuInternalRegistertarget_t)
            return this.t & mask;
        if (target === PpuInternalRegistertarget.PpuInternalRegistertarget_v)
            return this.v & mask;

        // unexpected default
        // abort();
        throw new Error('unexpected default.');
    }

    public getCoarseY(target: PpuInternalRegistertarget): number {
        const mask = PpuInternalRegister.COARSE_Y_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t)
            return (this.t & mask) >> 5;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v)
            return (this.v & mask) >> 5;

        // unexpected default
        // abort();
        throw new Error('unexpected default.');
    }

    public getNametableSelect(target: PpuInternalRegistertarget): number {
        const mask = PpuInternalRegister.NAMETABLE_SELECT_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t)
            return (this.t & mask) >> 10;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v)
            return (this.v & mask) >> 10;

        // unexpected default
        // abort();
        throw new Error('unexpected default.');
    }


    public getFineY(target: PpuInternalRegistertarget): number {
        const mask = PpuInternalRegister.FINE_Y_MASK;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_t)
            return (this.t & mask) >> 12;
        if (target == PpuInternalRegistertarget.PpuInternalRegistertarget_v)
            return (this.v & mask) >> 12;

        // unexpected default
        // abort();
        throw new Error('unexpected default.');
    }

    public getFineX(): number {
        return this.x;
    }

    public getW(): boolean {
        return this.w;
    }

    // 描画中のインクリメント(https://wiki.nesdev.com/w/index.php/PPU_scrolling#Wrapping_around)
    public incrementCoarseX(): void {
        const coarseX = this.getCoarseX(PpuInternalRegistertarget.PpuInternalRegistertarget_v);
        // tile 31 の次は 0 にもどす、上で実装したアクセサーは使わずに nesdev wiki の疑似コードをそのまま使っちゃう
        if (coarseX == 31) {
            this.v &= ~0x001F;          // coarse X = 0
            this.v ^= 0x0400;           // switch horizontal nametable
        } else {
            this.v++;
        }
    }

    public incrementY(): void {
        // こちらも nesdev wiki の疑似コードをそのまま使っちゃう
        if ((this.v & 0x7000) != 0x7000) {	    // if fine Y < 7
            this.v += 0x1000;					// increment fine Y
            return;
        }

        this.v &= ~0x7000;						// fine Y = 0
        let y = (this.v & 0x03E0) >> 5;			// let y = coarse Y
        if (y == 29) {
            y = 0;                              // coarse Y = 0
            this.v ^= 0x0800;                   // switch vertical nametable
        } else if (y == 31) {
            y = 0;                              // coarse Y = 0, nametable not switched
        } else {
            y += 1;							    // increment coarse Y
        }
        this.v = (this.v & ~0x03E0) | (y << 5);	// put coarse Y back into v
    }

    // 現在のタイルと attribute table のアドレス取得(https://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching)
    public getTileAddress(): number {
        return 0x2000 | (this.v & 0x0FFF);
    }

    public getAttributeAddress(): number {
        const v = this.v;
        return 0x23C0 | (v & 0x0C00) | ((v >> 4) & 0x38) | ((v >> 2) & 0x07);
    }

    // t の変更を v に反映
    public updateHorizontalV(): void {
        const HORIZONTAL_MASK = 0b000010000011111;
        this.v &= ~HORIZONTAL_MASK;
        const update = this.t & HORIZONTAL_MASK;
        this.v |= update;
    }

    public updateVerticalV(): void {
        const VERTICAL_MASK = 0b111101111100000;
        this.v &= ~VERTICAL_MASK;
        const update = this.t & VERTICAL_MASK;
        this.v |= update;
    }
}
