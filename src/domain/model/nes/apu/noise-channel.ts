/**
 * ノイズチャンネル。
 */
export class NoiseChannel {
    // $400C
    // 矩形波チャンネルと同じだが、 duty 比は存在しない
    private m_DecayLoop = false;
    private m_LengthEnabled = false;
    private m_DecayEnabled = false;
    private m_DecayV = 0;

    // $400E
    private m_FreqTimer = 0;
    private m_ShiftMode = false;

    // $400F
    private m_LengthCounter = 0;
    private m_DecayResetFlag = false;

    // その他
    private m_FreqCounter = 0;
    // 15ビットシフトレジスタにはリセット時に1をセットしておく必要があります。=エミュレータではとりあえず int にしてます;
    private m_NoiseShift = 1;

    // Decay 用変数(矩形波とおなじ)
    // 音量
    private m_DecayHiddenVol = 0;
    // ボリューム/エンベロープ周期
    private m_DecayCounter = 0;

    // ノイズチャンネルのベースアドレスは0x400C
    private m_BaseAddr = 0x400C;

    private m_ChannelEnabled = false;

    // 出力値
    private m_Output = 0;

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
