/**
 * 三角波チャンネル。
 */
export class TriangleWaveChannel {
    // $4008
    private m_LinearControl = false;
    private m_LengthEnabled = false;
    private m_LinearLoad = 0;

    // $400A
    private m_FreqTimer = 0;

    // $400B
    private m_LengthCounter = 0;
    private m_LinearReload = false;
    private m_ChannelEnabled = false;

    // その他
    private m_BaseAddr = 0x4008;     // 三角波チャンネルのベースアドレスは 0x4008 だけ
    private m_FreqCounter = 0;
    private m_LinearCounter = 0;
    private m_TriStep = 0;
    private m_OutputVal = 0;

    public WriteRegister(value: number, addr: number): void {
        // TODO 実装。
    }
    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        // TODO 実装。
    }

    public GetStatusBit(): number {
        // TODO 実装。
    }


    // 各 クロック(Apu クラスから呼び出すことを想定)
    public ClockTimer(): void {
        // TODO 実装。
    }

    public ClockQuarterFrame(): void {
        // TODO 実装。
    }

    public ClockHalfFrame(): void {
        // TODO 実装。
    }

    // 出力
    public GetOutPut(): number {
        // TODO 実装。
    }
}
