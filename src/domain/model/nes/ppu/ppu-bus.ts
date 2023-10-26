import { Mirroring } from "../cassette/mirroring";
import { Constants } from "../constants";
import { Cpu } from "../cpu/cpu";
import { InterruptType } from "../cpu/interrupt-type";
import { System } from "../system"
import { PpuSystem } from "./ppu-system";

/**
 * PPU から見えるメモリ空間に基づいてアクセスするクラス、PPU <-> カセット、 VRAM へのバス。
 * CPU -> PPU は CpuBus に持たせる。
 * 
 * TODO: 本当は Cassette だけへの依存でいいのに System 全体への依存になってしまっているのを直す。
 */
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
        this.m_pCpu?.interrupt(InterruptType.IRQ);
    }

    private getMirroredAddr(addr: number): number {
        // nametable 以外の範囲のアドレスが渡されたらプログラミングミス
        if (!(0x2000 <= addr && addr < 0x3000)) throw new Error('Out range Address of nametable.');

        const mirroring = this.m_pSystem.m_Cassette.getMirroring();
        if (mirroring === Mirroring.Horizontal) {
            // 水平ミラー: [0x2000, 0x2400) が [0x2400, 0x2800) に、[0x2800, 0x2c00) が[0x2c00, 0x3000) にミラーされる
            // ミラー範囲だったら雑に引き算をするぜ
            if ((0x2400 <= addr && addr < 0x2800) ||
                (0x2C00 <= addr && addr < 0x3000)) {
                addr -= 0x400;
            }
        }
        else if (mirroring === Mirroring.Vertical) {
            // 垂直ミラー: [0x2000, 0x2800) が [0x2800, 0x3000) にミラーされる
            if (0x2800 <= addr) {
                addr -= 0x800;
            }
        }

        return addr;
    }

    private getPaletteMirrorAddr(addr: number): number {
        return [0x3F10, 0x3F14, 0x3F18, 0x3F1C].includes(addr)
            ? addr - 0x10
            : addr;
    }
}
