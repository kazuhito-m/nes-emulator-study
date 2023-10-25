import { Constants } from "../constants";

/**
 * PPU のメモリ空間から参照される、名前が若干ややこしい(というかミスってる)が、要するに VRAM。
 */
export class PpuSystem {
    constructor(
        // 0x0000 - 0x1FFF: CHR-ROM(System のカセットを参照する)
        // 0x2000 - 0x2FFF: Nametable
        public m_NameTable: number[] = new Array(Constants.NAMETABLE_SIZE),
        // 0x3000 - 0x3EFF: 0x2000-0x2EFF のミラー(0x2FFF までではないことに注意する)
        // 0x3F00 - 0x3F1F: Palette
        public m_Pallettes: number[] = new Array(Constants.PALETTE_SIZE),
        // 0x3F20 - 0x3FFF: 0x3F00 - 0x3FFF のミラー
    ) { }
}