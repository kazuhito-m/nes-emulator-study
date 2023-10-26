import { ApuTable } from "./apu-table";

/**
 * 矩形波 チャンネル。
 * 
 * コメントのアドレスは矩形波チャンネル1のものであるとする。
 */
export class SquareWaveChannel {
    // エミュレーション用変数たち。
    //
    // 読み取り専用の値はレジスタからフェッチするだけでいいはずだが、
    // どれが読み取り専用かわからんので全部変数にしちゃう。
    // レジスタ書き込み時に設定することにする。

    // テーブル
    private readonly m_DutyTables: number[][] = [
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 1],
    ];

    // $4000		
    // Duty Table 配列先頭を指すポインタ		
    private m_DutyTable: number[] = this.m_DutyTables[0];  // TORIAEZU: 設定する前に音ならす ROM があってぬるぽ触ってしまうようなら考える

    private m_DecayLoop = false;
    private m_LengthEnabled = false;
    private m_DecayEnabled = false;
    private m_DecayV = 0;

    // $4001		
    private m_SweepTimer = 0;
    private m_SweepNegate = false;
    private m_SweepShift = 0;
    private m_SweepReload = false;
    private m_SweepEnabled = false;

    // $4002, $4003		
    private m_FreqTimer = 0;
    private m_LengthCounter = 0;

    // $4015、チャンネルによってことなる bit を見ることに注意		
    private m_ChannelEnabled = false;

    // レジスタの値ではないけどエミュレーションに必要
    // $4003 書き込みで初期化されるひとたち		
    private m_FreqCounter = 0;
    private m_DutyCounter = 0;
    private m_DecayResetFlag = false;

    // 矩形波チャンネルレジスタのベースアドレス		
    private m_BaseAddr = 0;

    // Decay 用変数		
    // 音量		
    private m_DecayHiddenVol = 0xf;
    // ボリューム/エンベロープ周期		
    private m_DecayCounter = 0;

    // sweep 用変数		
    private m_SweepCounter = 0;

    // 矩形波チャンネル 1 か？(sweep の挙動が分岐する)		
    private m_IsChannel1 = false;

    constructor(baseAddr: number, isChannel1: boolean) {
        this.m_IsChannel1 = isChannel1;
    }

    public WriteRegister(value: number, addr: number): void {
        const offset = addr - this.m_BaseAddr;

        switch (offset) {
            case 0:
                this.m_DutyTable = this.m_DutyTables[value >> 6];
                this.m_DecayLoop = ((value >> 5) & 1) === 1;
                this.m_LengthEnabled = !this.m_DecayLoop;
                this.m_DecayEnabled = ((value >> 4) & 1) === 0;
                this.m_DecayV = value & 0b1111;
                break;
            case 1:
                this.m_SweepTimer = (value >> 4) & 0b111;
                this.m_SweepNegate = ((value >> 3) & 1) === 1;
                this.m_SweepShift = value & 0b111;
                this.m_SweepReload = true;
                this.m_SweepEnabled = ((value >> 7) & 1) === 1 && this.m_SweepShift != 0;
                break;
            case 2:
                // this.m_FreqTImer の上位3bitだけ残してクリア
                this.m_FreqTimer &= 0b11100000000;
                // this.m_FreqTimer の 下位8bitを更新
                this.m_FreqTimer |= value;
                break;
            case 3:
                {
                    // this.m_FreqTimer の上位3 bit をクリア
                    this.m_FreqTimer &= 0b11111111;
                    const hi = value & 0b111;
                    this.m_FreqTimer |= (hi << 8);

                    // length Counter 更新
                    // 書き込み値の上位5bitが table のインデックス
                    let tableIndex = value & 0b11111000;
                    tableIndex >>= 3;
                    this.m_LengthCounter = new ApuTable().g_LengthTable[tableIndex];

                    this.m_FreqCounter = this.m_FreqTimer;
                    this.m_DutyCounter = 0;
                    this.m_DecayResetFlag = true;
                    break;
                }
            default:
                break;
        }
    }

    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        // 最下位1bit
        let channelEnabled = false;

        if (this.m_IsChannel1) {
            channelEnabled = (value & 1) === 1;
        }
        else {
            // 1(0-indexed)bit目
            channelEnabled = ((value >> 1) & 1) === 1;
        }

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
        // タイマ(音の周波数 ≒ 高さ を指定するためのもの)をクロック
        if (this.m_FreqCounter > 0) {
            this.m_FreqCounter--;
        }
        else {
            this.m_FreqCounter = this.m_FreqTimer;
            // 波は 8 区分あって、インデックスは mod 8 で計算する(NES on FPGA の 1番目のレジスタによってデューディサイクルが設定されます。 シーケンサはタイマから励起され、次のような波形を出力します。 のとこ)
            this.m_DutyCounter = (this.m_DutyCounter + 1) & 7;
        }
    }

    public ClockQuarterFrame(): void {
        // コメントはだいたい NES on FPGA に準拠
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
        // NES on FPGA でいうところのスイープユニット
        // $4001 書き込みで sweep_reload がたつ(NES on FPGA と食い違ってる？)
        // TODO: 裏取り だけど、 sweep のレジスタは $4001 なので、これであってる気もする
        if (this.m_SweepReload) {
            this.m_SweepCounter = this.m_SweepTimer;
            this.m_SweepReload = false;
        }
        else if (this.m_SweepCounter > 0) {
            // 分周器がクロックを出してないならなんもしない
            this.m_SweepCounter--;
        }
        else {
            // 分周器のカウンタをもとにもどす
            this.m_SweepCounter = this.m_SweepTimer;

            // NES on FPGA において、
            // 「isSweepForcingSilence は もしチャンネルの周期が8未満か、$7FFより大きくなったなら、スイープを停止し、 チャンネルを無音化します。」
            // にあたる処理
            if (this.m_SweepEnabled && !this.isSweepForcingSilence()) {
                if (this.m_SweepNegate) {
                    const isChannel1Bit = this.m_IsChannel1 ? 1 : 0;
                    // this.m_SweepShift は $4001 の下位3bit
                    // モードによって適切な方法で周波数 = 音階を更新
                    this.m_FreqTimer -= (this.m_FreqTimer >> this.m_SweepShift) + isChannel1Bit;
                }
                else {
                    this.m_FreqTimer += (this.m_FreqTimer >> this.m_SweepShift);
                }
            }
        }

        // 長さカウンタのクロック生成(NES on FPGA の l)
        if (this.m_LengthEnabled && this.m_LengthCounter > 0) {
            this.m_LengthCounter--;
        }
    }

    // 出力
    public GetOutPut(): number {
        if (!(this.m_DutyTable[this.m_DutyCounter]
            && this.m_LengthCounter != 0
            && !this.isSweepForcingSilence())) return 0;

        if (this.m_DecayEnabled) {
            // decay 有効 or not は $4000 の 4 bit 目できまる
            return this.m_DecayHiddenVol;
        }
        else {
            // decay_V は $4000 の下位4bit(0123bit目)できまる4bitのあたい
            // NES on FPGA  エンベロープジェネレータ の
            // チャンネルのボリューム出力として、 エンベロープ無効フラグがセットされているなら、 エンベロープ周期のnをそのまま出力します。 クリアされているならカウンタの値を出力します相当
            // 結局、エンベロープ無効なら $4000 の下位 4 bit がボリュームになって、有効ならカウンタの値 = decay_hidden_vol がボリュームになるとのこと
            return this.m_DecayV;
        }
    }

    // 内部実装用メソッドたち
    private isSweepForcingSilence(): boolean {
        return this.m_FreqTimer < 8 // チャンネルの周期が8未満
            || (!this.m_SweepNegate && (this.m_FreqTimer + (this.m_FreqTimer >> this.m_SweepShift) >= 0x800));
    }
}
