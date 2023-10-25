import { Constants } from "../constants";
import { Cpu, InterruptType } from "../cpu/cpu";
import { System } from "../system"
import { PpuSystem } from "./ppu-system";

export class PpuBus {
    private m_pSystem: System;
    private m_pPpuSystem: PpuSystem;
    // CPU にバスを繋ぐ
    private m_pCpu?: Cpu;
    private m_IsInitialized = false;

    constructor(pSystem: System, pPpuSystem: PpuSystem) {
        this.m_pSystem = pSystem;
        this.m_pPpuSystem = pPpuSystem;
    }

    // パレットテーブルの "下"にある nametableのミラーが PPU の内部バッファに読まれるのでそれに対応する
    public readByte(addr: number, isPpuBuffering: boolean = true): number {
        if (!isPpuBuffering) return this.readByteNonBuffer(addr);
        if (addr < Constants.PALETTE_BASE) return this.readByteNonBuffer(addr);

        // パレット領域の代わりに nametable 読み出し
        const offset = addr - Constants.NAMETABLE_MIRROR_BASE;
        // nametable の中だったらどこかを計算してから nametable mirror を計算
        const nameTableAddr = Constants.NAMETABLE_BASE + offset;
        const nameTableMirroredAddr = this.getMirroredAddr(nameTableAddr);

        const idx = nameTableMirroredAddr - Constants.NAMETABLE_BASE;
        return this.m_pPpuSystem.m_NameTable[idx];
    }

    private readByteNonBuffer(addr: number): number {
        // CHR ROM からの読み出し
        if (addr < Constants.NAMETABLE_BASE) {
            const ret = new Array<number>(1).fill(0);
            this.m_pSystem.m_Cassette.readChrRom(ret, addr, 1);
            return ret[0];
        } else if (addr < Constants.PALETTE_BASE) {
            // mirror 計算
            const mirroredAddr = this.getMirroredAddr(addr);

            // nametable 読み出し
            const offset = mirroredAddr - Constants.NAMETABLE_BASE;

            return this.m_pPpuSystem.m_NameTable[offset];
        } else {
            addr = this.getPaletteMirrorAddr(addr);

            // palette 読み出し
            const offset = addr - Constants.PALETTE_BASE;
            const idx = offset % Constants.PALETTE_SIZE;

            return this.m_pPpuSystem.m_Pallettes[idx];
        }
    }

    public writeByte(addr: number, data: number): void {
        // CHR ROM 書き込み(？)
        if (addr < Constants.NAMETABLE_BASE) {
            this.m_pSystem.m_Cassette.writeChrRom([data], addr, 1);
        } else if (addr < Constants.PALETTE_BASE) {
            // mirror 計算
            const mirroredAddr = this.getMirroredAddr(addr);

            // nametable 書き込み
            const offset = mirroredAddr - Constants.NAMETABLE_BASE;
            this.m_pPpuSystem.m_NameTable[offset] = data;
        } else {
            addr = this.getPaletteMirrorAddr(addr);

            // palette 書き込み
            const offset = addr - Constants.PALETTE_BASE;
            const idx = offset % Constants.PALETTE_SIZE;

            this.m_pPpuSystem.m_Pallettes[idx] = data;
        }
    }

    // オブジェクト生成時の循環依存を切るため、 Initialize で Cpu へのポインタを渡す
    public initialize(pCpu: Cpu): void {
        this.m_pCpu = pCpu;
        this.m_IsInitialized = true;
    }

    // 描画終了のタイミングに合わせて NMI を入れる
    public generateCpuInterrupt(): void {
        if (!this.m_IsInitialized) throw new Error('PPU Bus not initialized.')
        this.m_pCpu.interrupt(InterruptType.IRQ);
    }

    private getMirroredAddr(addr: number): number {

    }

    private getPaletteMirrorAddr(addr: number): number {
        return [0x3F10, 0x3F14, 0x3F18, 0x3F1C].includes(addr)
            ? addr - 0x10
            : addr;
    }
}
