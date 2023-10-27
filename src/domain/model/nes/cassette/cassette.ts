import { Constants } from "../constants";
import { INESHeader } from "./ines-header";
import { Mirroring } from "./mirroring";

export class Cassette {
    private static readonly PRG_ROM_UNIT = 16 * 1024;
    private static readonly CHR_ROM_UNIT = 8 * 1024;

    constructor(
        private m_PrgRom: number[] = new Array(Constants.PRG_ROM_MAX),
        private m_ChrRom: number[] = new Array(Constants.CHR_ROM_MAX),
        private m_Initialized = false,
        private m_Header = new INESHeader(),
        private m_PrgRomSize = 0,
        private m_ChrRomSize = 0
    ) { }

    // ROM のバイナリを書き込んだバッファとそのサイズを引数にとって初期化
    public initialize(pBuffer: number[], bufferSize: number): void {
        // iNES ヘッダーを読み込み
        if (bufferSize < 16) throw new Error('Header size invalid.');
        this.m_Header.initializeOf(pBuffer);

        // マジックナンバー 確認
        const headChars = String.fromCharCode(...this.m_Header.m_Magic);
        if (headChars !== "NES\x1A") throw new Error('Header chars invalid.');

        // TODO: バッファサイズのチェック

        let from: number, to: number;

        // PROGRAM ROM 切り出し
        const prgRomSize = this.m_Header.m_PrgRomSize * Cassette.PRG_ROM_UNIT;
        from = INESHeader.SIZE; to = from + prgRomSize;
        this.m_PrgRom = pBuffer.slice(from, to);

        // CHARACTER ROM 切り出し
        const chrRomSize = this.m_Header.m_ChrRomSize * Cassette.CHR_ROM_UNIT;
        from = to; to = from + chrRomSize;
        this.m_ChrRom = pBuffer.slice(from, to);

        this.m_PrgRomSize = prgRomSize;
        this.m_ChrRomSize = chrRomSize;

        this.m_Initialized = true;
    }

    public readPrgRom(pBuffer: number[], offset: number, size: number): void {
        if (!this.m_Initialized) throw new Error('Not initialized!');

        for (let i = 0; i < size; i++) {
            const withOffset = offset + i;
            // ROM が 16 KB の場合のミラーリング
            if (withOffset >= this.m_PrgRomSize) {
                const idx = withOffset % this.m_PrgRomSize;
                pBuffer[i] = this.m_PrgRom[idx];
            } else {
                pBuffer[i] = this.m_PrgRom[withOffset];
            }
        }
    }

    public writePrgRom(pBuffer: number[], offset: number, size: number): void {
        if (!this.m_Initialized) throw new Error('Not initialized!');
        if (offset + size > this.m_PrgRomSize) throw new Error('Target point over rom size!')
        for (let i = 0; i < size; i++) {
            this.m_PrgRom[i + offset] = pBuffer[i];
        }
    }

    public readChrRom(pBuffer: number[], offset: number, size: number): void {
        if (!this.m_Initialized) throw new Error('Not initialized!');
        // 必要なら mirror すること(必要なら assert 引っかかるはず)
        if (offset + size > this.m_ChrRomSize) throw new Error('Target point over rom size!')
        for (let i = 0; i < size; i++) {
            pBuffer[i] = this.m_ChrRom[i + offset];
        }
    }

    public writeChrRom(pBuffer: number[], offset: number, size: number): void {
        if (!this.m_Initialized) throw new Error('Not initialized!');
        if (offset + size > this.m_ChrRomSize) throw new Error('Target point over rom size!')
        for (let i = 0; i < size; i++) {
            this.m_ChrRom[i + offset] = pBuffer[i];
        }
    }

    public getMirroring(): Mirroring {
        const isVirtical = (this.m_Header.m_Flags6 & 1) === 1;
        return isVirtical ? Mirroring.Vertical : Mirroring.Horizontal;
    }
}
