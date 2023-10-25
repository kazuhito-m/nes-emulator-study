import { Cassette } from "./cassette/cassette";
import { Constants } from "./constants";
import { Pad, PadButton, PadId } from "./input/pad/pad";

export class System {
    // 0x0000 - 0x07FF: WRAM
    // 0x0800 - 0x1FFF: WRAM Mirror * 3 
    public m_Wram: number[] = new Array(Constants.WRAM_SIZE);
    // 0x2000 - 0x2007: PPU IO Register
    // 0x2009 - 0x3FFF: PPU IO Register Mirror * 1023
    // PPU レジスタは CpuBus を通して直接 PPU のレジスタを読み書きすることにする

    // 0x4000 - 0x401F: APU IO, PAD
    public m_IoReg: number[] = new Array(Constants.APU_IO_REG_SIZE);

    // Pad: 0x4016, 0x4017
    public m_Pads = [new Pad(), new Pad()];

    public m_Cassette = new Cassette();

    // TORIAEZU: カセットの内容はコンストラクタで受け取る
    constructor(pBuffer: number[], bufferSize: number) {
        this.m_Cassette.initialize(pBuffer, bufferSize);
    }

    private static readonly ALL_PAD_IDS = [PadId.Zero, PadId.One];

    public pushButton(id: PadId, button: PadButton): void {
        if (!System.ALL_PAD_IDS.includes(id)) return;
        this.m_Pads[id].pushButton(button);
    }

    public releaseButton(id: PadId, button: PadButton): void {
        if (!System.ALL_PAD_IDS.includes(id)) return;
        this.m_Pads[id].releaseButton(button);
    }
}