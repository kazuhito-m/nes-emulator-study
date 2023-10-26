import { ApuTable } from "./apu-table";

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
        const offset = addr - this.m_BaseAddr;
        switch (offset) {
            case 0:
                // $4008 の 7 bit 目は長さカウンタフラグ
                this.m_LinearControl = ((value >> 7) & 1) == 1;
                this.m_LengthEnabled = !this.m_LinearControl;
                // 線形カウンタのロード値
                this.m_LinearLoad = value & 0b1111111;
                break;
            case 1:
                break;
            case 2:
                // $400A
                // m_FreqTimer の上位3bitだけ残してクリア
                this.m_FreqTimer &= 0b11100000000;
                // m_FreqTimer の 下位8bitを更新
                this.m_FreqTimer |= value;
                break;
            case 3:
                {
                    // $400B
                    // m_FreqTimer の上位3 bit をクリア
                    this.m_FreqTimer &= 0b11111111;
                    const hi = value & 0b111;
                    this.m_FreqTimer |= (hi << 8);

                    // length Counter 更新
                    // 書き込み値の上位5bitが table のインデックス
                    let tableIndex = value & 0b11111000;
                    tableIndex >>= 3;

                    if (this.m_ChannelEnabled) {
                        this.m_LengthCounter = new ApuTable().g_LengthTable[tableIndex];
                    }

                    this.m_LinearReload = true;
                    break;
                }
            default:
                break;
        }
    }

    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        // 2(0-indexed)bit目
        this.m_ChannelEnabled = ((value >> 2) & 1) === 1;;
        if (!this.m_ChannelEnabled) {
            this.m_LengthCounter = 0;
        }
    }

    public GetStatusBit(): number {
        return this.m_LengthCounter != 0 ? 1 : 0;
    }


    // 各 クロック(Apu クラスから呼び出すことを想定)
    public ClockTimer(): void {
        // タイマをクロック、その値によって三角波チャンネルをクロック
        let ultraSonic = false;

        if (this.m_FreqTimer < 2 && this.m_FreqCounter == 0) {
            ultraSonic = true;
        }

        let clockTriUnit = true;

        if (this.m_LengthCounter == 0) {
            clockTriUnit = false;
        }
        if (this.m_LinearCounter == 0) {
            clockTriUnit = false;
        }
        if (ultraSonic) {
            clockTriUnit = false;
        }

        if (clockTriUnit) {
            if (this.m_FreqCounter > 0) {
                this.m_FreqCounter--;
            }
            else {
                this.m_FreqCounter = this.m_FreqTimer;
                // F E D C B A 9 8 7 6 5 4 3 2 1 0 0 1 2 3 4 5 6 7 8 9 A B C D E F のシーケンスを生成 するためのインデックスが this.m_TriStep
                this.m_TriStep = (this.m_TriStep + 1) & 0x1F;
            }
        }

        // TORIAEZU: ClockTimer の責務からは外れるが、三角波ユニットをクロックした直後の値で出力値を更新する
        if (ultraSonic) {
            // Disch の疑似コードでは 7.5 って言ってるけど[0, F]の中心で止める、という意味なので7でもいいはず
            this.m_OutputVal = 7;
        }
        else if (this.m_TriStep & 0x10) {
            // 0x10 のビットが立ってたら、そのビットを0にして、その下の4bitを反転することで F E D C B A 9 8 7 6 5 4 3 2 1 0 0 1 2 3 4 5 6 7 8 9 A B C D E F のシーケンスを生成
            // cf. http://pgate1.at-ninja.jp/NES_on_FPGA/nes_apu.htm の 三角波 のとこ
            this.m_OutputVal = this.m_TriStep ^ 0x1F;
        }
        else {
            this.m_OutputVal = this.m_TriStep;
        }
    }

    public ClockQuarterFrame(): void {
        // 線形カウンタの処理
        if (this.m_LinearReload) {
            // レジスタ$400Bへの書き込みによって、線形カウンタを停止し、カウンタへ音の長さをロードします(NES on FPGA)
            this.m_LinearCounter = this.m_LinearLoad;
        }
        else if (this.m_LinearCounter > 0) {
            // (線形カウンタのコントロールフラグ(http://pgate1.at-ninja.jp/NES_on_FPGA/nes_apu.htm)がクリアされてたら？) && カウンタが0でなければデクリメント
            this.m_LinearCounter--;
        }
        if (!this.m_LinearControl) {
            // TODO: 出典をしらべる
            this.m_LinearReload = false;
        }
    }

    public ClockHalfFrame(): void {
        // 長さカウンタのクロック生成
        if (this.m_LengthEnabled && this.m_LengthCounter > 0) {
            this.m_LengthCounter--;
        }
    }

    // 出力
    public GetOutPut(): number {
        return this.m_OutputVal;
    }
}
