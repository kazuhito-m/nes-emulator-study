'use strict';

/**
 * コンストラクタでグローバルなテーブル。
 */
export class ApuTable {
    /**
     * コンストラクタでグローバルなテーブルを定義する。
     */
    constructor(
        public readonly g_LengthTable: number[] = new Array(32),
        public readonly g_NoiseFreqTable: number[] = new Array(16),
        public readonly g_DmcFreqTable: number[] = new Array(16)
    ) {
        // 値のソース http://pgate1.at-ninja.jp/NES_on_FPGA/nes_apu.htm
        g_LengthTable[0b00000] = 0x0A;
        g_LengthTable[0b00010] = 0x14;
        g_LengthTable[0b00100] = 0x28;
        g_LengthTable[0b00110] = 0x50;
        g_LengthTable[0b01000] = 0xA0;
        g_LengthTable[0b01010] = 0x3C;
        g_LengthTable[0b01100] = 0x0E;
        g_LengthTable[0b01110] = 0x1A;
        g_LengthTable[0b10000] = 0x0C;
        g_LengthTable[0b10010] = 0x18;
        g_LengthTable[0b10100] = 0x30;
        g_LengthTable[0b10110] = 0x60;
        g_LengthTable[0b11000] = 0xC0;
        g_LengthTable[0b11010] = 0x48;
        g_LengthTable[0b11100] = 0x10;
        g_LengthTable[0b11110] = 0x20;
        g_LengthTable[0b00001] = 0xFE;
        g_LengthTable[0b00011] = 0x02;
        g_LengthTable[0b00101] = 0x04;
        g_LengthTable[0b00111] = 0x06;
        g_LengthTable[0b01001] = 0x08;
        g_LengthTable[0b01011] = 0x0A;
        g_LengthTable[0b01101] = 0x0C;
        g_LengthTable[0b01111] = 0x0E;
        g_LengthTable[0b10001] = 0x10;
        g_LengthTable[0b10011] = 0x12;
        g_LengthTable[0b10101] = 0x14;
        g_LengthTable[0b10111] = 0x16;
        g_LengthTable[0b11001] = 0x18;
        g_LengthTable[0b11011] = 0x1A;
        g_LengthTable[0b11101] = 0x1C;
        g_LengthTable[0b11111] = 0x1E;

        // ノイズ、値のソースは NES on FPGA
        g_NoiseFreqTable[0] = 0x004;
        g_NoiseFreqTable[1] = 0x008;
        g_NoiseFreqTable[2] = 0x010;
        g_NoiseFreqTable[3] = 0x020;
        g_NoiseFreqTable[4] = 0x040;
        g_NoiseFreqTable[5] = 0x060;
        g_NoiseFreqTable[6] = 0x080;
        g_NoiseFreqTable[7] = 0x0A0;
        g_NoiseFreqTable[8] = 0x0CA;
        g_NoiseFreqTable[9] = 0x0FE;
        g_NoiseFreqTable[10] = 0x17C;
        g_NoiseFreqTable[11] = 0x1FC;
        g_NoiseFreqTable[12] = 0x2FA;
        g_NoiseFreqTable[13] = 0x3F8;
        g_NoiseFreqTable[14] = 0x7F2;
        g_NoiseFreqTable[15] = 0xFE4;

        // DMC、値のソースは以下略
        g_DmcFreqTable[0] = 0x1AC;
        g_DmcFreqTable[1] = 0x17C;
        g_DmcFreqTable[2] = 0x154;
        g_DmcFreqTable[3] = 0x140;
        g_DmcFreqTable[4] = 0x11E;
        g_DmcFreqTable[5] = 0x0FE;
        g_DmcFreqTable[6] = 0x0E2;
        g_DmcFreqTable[7] = 0x0D6;
        g_DmcFreqTable[8] = 0x0BE;
        g_DmcFreqTable[9] = 0x0A0;
        g_DmcFreqTable[0xA] = 0x08E;
        g_DmcFreqTable[0xB] = 0x080;
        g_DmcFreqTable[0xC] = 0x06A;
        g_DmcFreqTable[0xD] = 0x054;
        g_DmcFreqTable[0xE] = 0x048;
        g_DmcFreqTable[0xF] = 0x036;

        Object.freeze(g_LengthTable);
        Object.freeze(g_NoiseFreqTable);
        Object.freeze(g_DmcFreqTable);
    }
}
