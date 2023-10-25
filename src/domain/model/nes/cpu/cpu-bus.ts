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
        // WRAM からの読み出し
        if (addr < Constants.PPU_REG_BASE) {
    // Mirror 対応のため WRAM SIZE であまりをとる
    size_t idx = addr % Constants.WRAM_SIZE;
            return m_pSystem -> m_Wram[idx];
        }
        else if (addr < Constants.APU_IO_REG_BASE) {
    size_t offset = addr - Constants.PPU_REG_BASE;
    size_t idx = offset % Constants.PPU_REG_SIZE;

            switch (idx) {
                case 2:
                    return m_pPpu -> ReadPpuStatus();
                case 7:
                    return m_pPpu -> ReadPpuData();
                default:
                    // unexpected
                    abort();
                    break;
            }
        }
        else if (addr < CASSETTE_BASE) {
    size_t idx = addr - APU_IO_REG_BASE;

            // APU
            if (addr == 0x4015) {
                return m_pApu -> ReadRegister4015();
            }
            // Pad
            else if (addr == 0x4016) {
                return m_pSystem -> m_Pads[0].ReadPad();
            }
            else if (addr == 0x4017) {
                return m_pSystem -> m_Pads[1].ReadPad();
            }

            // TORIAEZU: 未実装のレジスタ読み出しは残しておく
            return m_pSystem -> m_IoReg[idx];
        }
        else {
            // TORIAEZU: カセットの拡張 ROM RAM は気にしない
            assert(addr >= CASSETTE_PRG_ROM_BASE);

    int offset = addr - CASSETTE_PRG_ROM_BASE;
    uint8_t ret;
            // CPU から見えるのは PRG ROM のみ
            m_pSystem -> m_Cassette.ReadPrgRom(& ret, offset, 1);
            return ret;
        }
    }

    public writeByte(addr: number, data: number): void {

    }

    // DMA 用 API
    // System 上のメモリから PPU 上の OAM に DMA する。 DMA は基本的に VBLANK 中に行われることに注意する。(4.5Line 分くらいのPPU時間を消費するが、それによって NMI を発生し損ねたり sprite 0 hit をし損ねたりすることはない。)

    // DMA 実行してかかったクロック数を返す、 Kick されてない場合は0
    public runDma(cpuCycles: number): number {

    }

    // 転送元の アドレスの上位バイトを与えてDMA 起動、下位バイトは 00
    public kickDma(upperSrcAddr: number): void {

    }
}
