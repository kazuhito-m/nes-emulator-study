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

    // 内部実装用メソッドたち
    private IsSweepForcingSilence(): boolean {
        // TODO 実装。
    }
}