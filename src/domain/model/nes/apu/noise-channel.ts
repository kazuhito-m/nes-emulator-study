import { ApuTable } from "./apu-table";

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
        const table = new ApuTable();

        const offset = addr - this.m_BaseAddr;

        switch (offset) {
            case 0:
                // $400C
                this.m_DecayLoop = ((value >> 5) & 1) === 1;
                this.m_LengthEnabled = !this.m_DecayLoop;
                this.m_DecayEnabled = ((value >> 4) & 1) == 0;
                this.m_DecayV = value & 0b1111;
                break;
            case 1:
                break;
            case 2:
                {
                    // $400E
                    const idx = value & 0b1111;
                    this.m_FreqTimer = table.g_NoiseFreqTable[idx];
                    // this.m_FreqTimer = 0x40;

                    // ランダムモード生成フラグ
                    this.m_ShiftMode = ((value >> 7) & 1) === 1;
                    break;
                }
            case 3:
                {
                    if (this.m_ChannelEnabled) {
                        // length Counter 更新
                        // 書き込み値の上位5bitが table のインデックス
                        let tableIndex = value & 0b11111000;
                        tableIndex >>= 3;
                        this.m_LengthCounter = table.g_LengthTable[tableIndex];

                        this.m_DecayResetFlag = true;
                    }
                    break;
                }
            default:
                break;
        }
    }

    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        // 3(0-indexed)bit目
        let channelEnabled = false;
        channelEnabled = ((value >> 3) & 1) === 1;

        this.m_ChannelEnabled = channelEnabled;
        if (!this.m_ChannelEnabled) {
            this.m_LengthCounter = 0;
        }
    }

    public GetStatusBit(): number {
        return this.m_LengthCounter != 0 ? 1 : 0;
    }


    // 各 クロック(Apu クラスから呼び出すことを想定)
    public ClockTimer(): void {
        if (this.m_FreqCounter > 0) {
            this.m_FreqCounter--;
        }
        else {
            this.m_FreqCounter = this.m_FreqTimer;

            // NES on FPGA:
            // 15ビットシフトレジスタにはリセット時に1をセットしておく必要があります。 
            // タイマによってシフトレジスタが励起されるたびに1ビット右シフトし、 ビット14には、ショートモード時にはビット0とビット6のEORを、 ロングモード時にはビット0とビット1のEORを入れます。
            let topBit;

            if (this.m_ShiftMode) {
                const shift6 = (this.m_NoiseShift >> 6) & 1;
                const shift0 = this.m_NoiseShift & 1;

                topBit = shift6 ^ shift0;
            }
            else {
                const shift1 = (this.m_NoiseShift >> 1) & 1;
                const shift0 = this.m_NoiseShift & 1;

                topBit = shift1 ^ shift0;
            }

            // topBit を 15 bit目(0-indexed) にいれる
            this.m_NoiseShift &= ~(1 << 15);
            this.m_NoiseShift |= (topBit << 15);

            this.m_NoiseShift >>= 1;
        }

        // ClockTimer は 1 APU クロックごとに呼び出されるので出力値の決定もここでやる
        // シフトレジスタのビット0が1なら、チャンネルの出力は0となります。(NES on FPGA)
        // 長さカウンタが0でない ⇔ channel active
        if ((this.m_NoiseShift & 1) == 0 && this.m_LengthCounter != 0) {
            if (this.m_DecayEnabled) {
                this.m_Output = this.m_DecayHiddenVol;
            }
            else {
                this.m_Output = this.m_DecayV;
            }
        }
        else {
            this.m_Output = 0;
        }
    }

    public ClockQuarterFrame(): void {
        // 矩形波のコピペだけど、共通化するのも違う気がするのでコピペのまま……
        // フレームシーケンサによって励起されるとき、 最後のクロック以降チャンネルの4番目のレジスタへの書き込みがあった場合、 カウンタへ$Fをセットし、分周器へエンベロープ周期をセットします
        if (this.m_DecayResetFlag) {
            this.m_DecayResetFlag = false;
            this.m_DecayHiddenVol = 0xf;

            // decay_counter == エンベロープ周期(分周器でつかうもの)
            // この if にはいるときの1回 + else の時が dacay_V 回なので、周期は decay_v+1になるよね(NES on FPGA)
            this.m_DecayCounter = this.m_DecayV;
        }
        else {
            // そうでなければ、分周器を励起します。
            // カウンタ = decay_hidden_vol であってる？(たぶんあってると思う)
            // 特定条件でカウンタの値が volume になるからこの名前なのかも。
            if (this.m_DecayCounter > 0) {
                this.m_DecayCounter--;
            }
            else {
                this.m_DecayCounter = this.m_DecayV;
                // 分周器が励起されるとき、カウンタがゼロでなければデクリメントします
                if (this.m_DecayHiddenVol > 0) {
                    this.m_DecayHiddenVol--;
                }
                else if (this.m_DecayLoop) {
                    // カウンタが0で、ループフラグがセットされているならカウンタへ$Fをセットします。
                    this.m_DecayHiddenVol = 0xf;
                }
            }
        }
    }

    public ClockHalfFrame(): void {
        // 矩形波とちがってスイープユニットはない
        // 長さカウンタのクロック生成(NES on FPGA の l)
        if (this.m_LengthEnabled && this.m_LengthCounter > 0) {
            this.m_LengthCounter--;
        }
    }


    // 出力
    public GetOutPut(): number {
        return this.m_Output;
    }
}
