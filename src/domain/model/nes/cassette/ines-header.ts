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
        this.m_Magic = bytes.slice(0, 4);
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

