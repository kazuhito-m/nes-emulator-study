export namespace Constants {
    export const PRG_ROM_MAX = 0x8000;
    export const CHR_ROM_MAX = 0x2000;

    // CPU Memory Map
    export const WRAM_SIZE = 0x800;
    export const PPU_REG_SIZE = 0x8;
    export const APU_IO_REG_SIZE = 0x20;

    // PPU Memory Map
    // TORIAEZU: ミラーリングは考慮しないで4画面分とっておく
    export const NAMETABLE_SIZE = 0x1000;
    export const PALETTE_SIZE = 0x20;
    // Nametable と Attribute Tableのひとつぶんのサイズ
    export const NAME_TABLE_SINGLE_SIZE = 0x3C0;
    export const ATTRIBUTE_TABLE_SINGLE_SIZE = 0x40;
    // ネームテーブルをインデックス指定するときに必要……
    export const NAME_TABLE_AND_ATTRIBUTE_TABLE_SINGLE_SIZE = NAME_TABLE_SINGLE_SIZE + ATTRIBUTE_TABLE_SINGLE_SIZE;
    // パターンテーブルをインデックス指定するときに必要(パターンテーブル1要素のサイズは16byte)
    export const PATTERN_TABLE_ELEMENT_SIZE = 16;

    // OAM(Object Attribute Memory / Sprite Memory)
    export const OAM_SIZE = 256;

    // Base Addr
    export const PPU_REG_BASE = 0x2000;
    export const APU_IO_REG_BASE = 0x4000;
    export const CASSETTE_BASE = 0x4020;
    export const CASSETTE_PRG_ROM_BASE = 0x8000;

    // PPU Base Addr
    export const NAMETABLE_BASE = 0x2000;
    // 0x3000-0x3EFF にネームテーブル 4 枚分のミラー
    export const NAMETABLE_MIRROR_BASE = 0x3000;
    export const PALETTE_BASE = 0x3F00;

    // PPU Offset
    // PALETTE_BASE から スプライトパレットのベースアドレスへのオフセット
    export const SPRITE_PALETTE_OFFSET = 0x10;

    // PPU Output Size
    export const PPU_OUTPUT_X = 256;
    export const PPU_OUTPUT_Y = 240;
    export const PPU_VBLANK_Y = 22;


    // masks
    export const B_FLAG_MASK = 0b00110000;

    // ppu masks(0x2001)
    export const PPUMASKS_DISPLAY_TYPE = 1 << 0;
    export const PPUMASKS_ENABLE_BG_MASK = 1 << 1;
    export const PPUMASKS_ENABLE_SPRITE_MASK = 1 << 2;
    export const PPUMASKS_ENABLE_BG = 1 << 3;
    export const PPUMASKS_ENABLE_SPRITE = 1 << 4;
    export const PPUMASKS_BG_COLOR = 0b111 << 5;

    // ppu status(0x2002)
    export const PPUSTATUS_SPRITE_OVERFLOW = 1 << 5;
    export const PPUSTATUS_SPRITE_0_HIT = 1 << 6;
    export const PPUSTATUS_VBLANK = 1 << 7;
}
