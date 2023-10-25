import { Apu } from "../apu/apu";
import { Constants } from "../constants";
import { Ppu } from "../ppu/ppu";
import { System } from "../system";

/**
 * System へのポインタを持ち、CPU から見えるメモリ空間に基づいてアクセスするクラス。
 */
export class CpuBus {
    constructor(
        private m_pSystem: System,
        private m_pPpu: Ppu,
        private m_pApu: Apu,
        // DMA は CpuBus が担う(実際の HW 構成もそうなっているはず。)
        private m_IsDmaRunning: boolean = false,
        private m_DmaUpperSrcAddr: number = 0
    ) { }

    public readByte(addr: number): number {
        const m_pSystem = this.m_pSystem;
        const m_pApu = this.m_pApu;
        const m_pPpu = this.m_pPpu;

        // WRAM からの読み出し
        if (addr < Constants.PPU_REG_BASE) {
            // Mirror 対応のため WRAM SIZE であまりをとる
            const idx = addr % Constants.WRAM_SIZE;
            return m_pSystem.m_Wram[idx];
        } else if (addr < Constants.APU_IO_REG_BASE) {
            const offset = addr - Constants.PPU_REG_BASE;
            const idx = offset % Constants.PPU_REG_SIZE;

            switch (idx) {
                case 2:
                    return m_pPpu.readPpuStatus();
                case 7:
                    return m_pPpu.readPpuData();
                default:
                    // unexpected
                    // abort();
                    throw new Error('unexpected');
            }
        } else if (addr < Constants.CASSETTE_BASE) {
            const idx = addr - Constants.APU_IO_REG_BASE;

            // APU
            if (addr == 0x4015) {
                return m_pApu.readRegister4015();
            }
            // Pad
            else if (addr == 0x4016) {
                return m_pSystem.m_Pads[0].readPad();
            }
            else if (addr == 0x4017) {
                return m_pSystem.m_Pads[1].readPad();
            }

            // TORIAEZU: 未実装のレジスタ読み出しは残しておく
            return m_pSystem.m_IoReg[idx];
        } else {
            // TORIAEZU: カセットの拡張 ROM RAM は気にしない
            if (addr < Constants.CASSETTE_PRG_ROM_BASE) throw new Error('Not support Extend ROM/RAM');

            const offset = addr - Constants.CASSETTE_PRG_ROM_BASE;
            const ret = [0];
            // CPU から見えるのは PRG ROM のみ
            m_pSystem.m_Cassette.readPrgRom(ret, offset, 1);
            return ret[0];
        }
    }

    public writeByte(addr: number, data: number): void {
        const m_pSystem = this.m_pSystem;
        const m_pApu = this.m_pApu;
        const m_pPpu = this.m_pPpu;

        // WRAM からの読み出し
        if (addr < Constants.PPU_REG_BASE) {
            // Mirror 対応のため WRAM SIZE であまりをとる
            const idx = addr % Constants.WRAM_SIZE;
            m_pSystem.m_Wram[idx] = data;
        } else if (addr < Constants.APU_IO_REG_BASE) {
            const offset = addr - Constants.PPU_REG_BASE;
            const idx = offset % Constants.PPU_REG_SIZE;
            switch (idx) {
                case 0:
                    m_pPpu.writePpuCtrl(data);
                    break;
                case 1:
                    m_pPpu.writePpuMask(data);
                    break;
                case 3:
                    m_pPpu.writeOamAddr(data);
                    break;
                case 4:
                    m_pPpu.writeOamData(data);
                    break;
                case 5:
                    m_pPpu.writePpuScroll(data);
                    break;
                case 6:
                    m_pPpu.writePpuAddr(data);
                    break;
                case 7:
                    m_pPpu.writePpuData(data);
                    break;
                default:
                    // unexpected
                    // abort();
                    throw new Error('unexpected');
            }
        } else if (addr < Constants.CASSETTE_BASE) {
            const idx = addr - Constants.APU_IO_REG_BASE;
            // TORIAEZU: 疑似書き込みは残しておく(意味ないけど、デバッグ用くらいに)
            m_pSystem.m_IoReg[idx] = data;

            const APU_CHANNEL_REG_MAX = 0x4013;
            if (addr <= APU_CHANNEL_REG_MAX) {
                // APU レジスタ書き込み
                m_pApu.writeRegister(data, addr);
            }

            // APU コントロールレジスタ
            if (addr == 0x4015 || addr == 0x4017) {
                m_pApu.writeRegister(data, addr);
            }

            // DMA
            if (addr == 0x4014) {
                this.kickDma(data);
            }

            // Pad
            if (addr == 0x4016) {
                // 4016 の書き込みで Pad 0 1 の setstrobe されるのが正しい？ メモ: https://taotao54321.hatenablog.com/entry/2017/04/11/011850
                // 4017 書き込みは APU 制御なので。
                const onStrobe = (data & 1) === 1;
                m_pSystem.m_Pads.forEach(pad => pad.setStrobe(onStrobe));
            }
        } else {
            // TORIAEZU: カセットの拡張 ROM RAM は気にしない
            if (addr < Constants.CASSETTE_PRG_ROM_BASE) throw new Error('Not support Extend ROM/RAM');

            const offset = addr - Constants.CASSETTE_PRG_ROM_BASE;
            // CPU から見えるのは PRG ROM のみ
            m_pSystem.m_Cassette.writePrgRom([data], offset, 1);
        }
    }

    // DMA 用 API
    // System 上のメモリから PPU 上の OAM に DMA する。 DMA は基本的に VBLANK 中に行われることに注意する。(4.5Line 分くらいのPPU時間を消費するが、それによって NMI を発生し損ねたり sprite 0 hit をし損ねたりすることはない。)

    // DMA 実行してかかったクロック数を返す、 Kick されてない場合は0
    public runDma(cpuCycles: number): number {
        if (!this.m_IsDmaRunning) return 0;

        if (this.m_pPpu.OAMADDR !== 0) throw new Error('Non ZERO PPU-OAMADDR.');

        const addr = this.m_DmaUpperSrcAddr << 8;

        for (let i = 0; i < Constants.OAM_SIZE; i++) {
            this.m_pPpu.m_Oam[i] = this.readByte(addr + i);
        }

        return cpuCycles % 2 == 0 ? 513 : 514;
    }

    // 転送元の アドレスの上位バイトを与えてDMA 起動、下位バイトは 00
    public kickDma(upperSrcAddr: number): void {
        this.m_DmaUpperSrcAddr = upperSrcAddr;
        this.m_IsDmaRunning = true;
    }
}
