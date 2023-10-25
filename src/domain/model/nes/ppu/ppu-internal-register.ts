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

    public setCoarseX(target: PpuInternalRegistertarget, data: number): void { }
    public setCoarseY(target: PpuInternalRegistertarget, data: number): void { }
    public setNametableSelect(target: PpuInternalRegistertarget, data: number): void { }
    public setFineY(target: PpuInternalRegistertarget, data: number): void { }
    public setFineX(data: number): void { }
    public setW(data: boolean): void { }
    // PPUADDR 反映用(紛らわしいけど、 PPUADDR としては使わない、PPUADDR への書き込みと PPUSCROLL への書き込みを混ぜて使ってるゲームのため)
    public setUpperPpuAddr(data: number): void { }
    public setLowerPpuAddr(data: number): void { }

    public getCoarseX(target: PpuInternalRegistertarget): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getCoarseY(target: PpuInternalRegistertarget): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getNametableSelect(target: PpuInternalRegistertarget): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getFineY(target: PpuInternalRegistertarget): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getFineX(): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getW(): boolean {
        // TODO 実装。以下は仮。
        return false;
    }

    // 描画中のインクリメント
    public incrementCoarseX(): void { }
    public incrementY(): void { }

    // 現在のタイルと attribute table のアドレス取得
    public getTileAddress(): number {
        // TODO 実装。以下は仮。
        return 0;
    }
    public getAttributeAddress(): number {
        // TODO 実装。以下は仮。
        return 0;
    }

    // t の変更を v に反映
    public updateHorizontalV(): void { }
    public updateVerticalV(): void { }
}