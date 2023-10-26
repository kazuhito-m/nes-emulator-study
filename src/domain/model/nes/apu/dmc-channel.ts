import { Apu } from "./apu";

/**
 * DMC チャンネル。
 */
export class DmcChannel {
    private m_BaseAddr = 0x4010;

    private m_DmcIrqEnabled = false;
    private m_DmcLoop = false;
    private m_FreqTimer = 0;

    // $4011
    private m_Output = 0;

    // $4012
    private m_AddrLoad = 0;

    // $4013
    private m_LengthLoad = 0;

    // $4015
    private m_Length = 0;
    private m_Addr = 0;
    private m_DmcIrqPending = false;

    // そのほか
    private m_FreqCounter = 0;
    private m_OutputUnitSilent = true;
    private m_OutputShift = 0; // TORIAEZU: BitsInOutputUnit を 0 で初期化すると、最初のデクリメントで負になってしまうので1にしとく
    private m_BitsInOutputUnit = 1;
    private m_SampleBuffer = 0;
    private m_IsSampleBufferEmpty = true;

    // 自分を保持する APU クラスへのポインタ(DMA 用)
    private m_pApu?: Apu;

    constructor(pApu: Apu) {
        this.m_pApu = pApu;
    }

    public WriteRegister(value: number, addr: number): void {
        // TODO 実装。
    }

    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        // TODO 実装。
    }

    // DMC の Status bit は length の割り込みフラグの2つあるので出力引数で出す
    public GetStatusBit(): number {
        // TODO 実装。
    }

    // クロック(Apu クラスから呼び出すことを想定)
    // DMC はフレームシーケンサにクロックされることはない(？)のでタイマだけでOK
    // DMA で CPU が止まるかもしれないので止まった場合そのクロック数をかえす
    public ClockTimer(): number {
        // TODO 実装。
    }

    // 出力
    public GetOutPut(): number {
        // TODO 実装。
    }
}
