import { Constants } from "../constants";

export enum Mirroring {
    Horizontal,
    Vertical
    // TODO: 変な Mirroring(4画面全部とか)
};

export class INESHeader {
    constructor(
        public m_Magic: number[] = new Array(4),
        // 16KiB 単位の PRG ROM のサイズ
        public m_PrgRomSize = 0,
        // 8 KiB 単位の CHR ROM のサイズ
        public m_ChrRomSize = 0,
        public m_Flags6 = 0,
        private m_Flags7 = 0,
        private m_Flags8 = 0,
        private m_Flags9 = 0,
        private m_Flags10 = 0,
        private padding: number[] = new Array(5)
    ) { }

    public static readonly SIZE = 16;

    public toBytes(): number[] {
        const middleBytes = [
            this.m_PrgRomSize,
            this.m_ChrRomSize,
            this.m_Flags6,
            this.m_Flags7,
            this.m_Flags8,
            this.m_Flags9,
            this.m_Flags10,
        ];
        return this.m_Magic
            .concat(middleBytes)
            .concat(this.padding);
    }

    public initializeOf(bytes: number[]): void {
        this.m_Magic = bytes.slice(3);
        this.m_PrgRomSize = bytes[4];
        this.m_ChrRomSize = bytes[5];
        this.m_Flags6 = bytes[6];
        this.m_Flags7 = bytes[7];
        this.m_Flags8 = bytes[8];
        this.m_Flags9 = bytes[9];
        this.m_Flags10 = bytes[10];
        this.padding = bytes.slice(11, 15);
    }
}

export class Cassette {
    private static readonly PRG_ROM_UNIT = 16 * 1024;
    private static readonly CHR_ROM_UNIT = 8 * 1024;

    constructor(
        private m_PrgRom: number[] = new Array(Constants.PRG_ROM_MAX),
        private m_ChrRom: number[] = new Array(Constants.CHR_ROM_MAX),
        private m_Initialized = false,
        private m_Header: INESHeader = new INESHeader(),
        private m_PrgRomSize = 0,
        private m_ChrRomSize = 0
    ) { }

    // ROM のバイナリを書き込んだバッファとそのサイズを引数にとって初期化
    public initialize(pBuffer: number[], bufferSize: number): void {
        // iNES ヘッダーを読み込み
        if (bufferSize >= 16) throw new Error('Header size invalid.');
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
        return this.m_Header.m_Flags6 & 1
            ? Mirroring.Vertical
            : Mirroring.Horizontal;
    }
}
