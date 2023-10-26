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

    // $4000		
    // Duty Table 配列先頭を指すポインタ		
    private m_DutyTable: number[][] = [
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 1],
    ];  // TORIAEZU: 設定する前に音ならす ROM があってぬるぽ触ってしまうようなら考える

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

    // 内部実装用メソッドたち
    private IsSweepForcingSilence(): boolean {
        // TODO 実装。
    }
}