import { ApuBus } from "./apu-bus";
import { ApuTable } from "./apu-table";
import { DmcChannel } from "./dmc-channel";
import { NoiseChannel } from "./noise-channel";
import { SequencerMode } from "./sequencer-mode";
import { SquareWaveChannel } from "./square-wave-channel";
import { TriangleWaveChannel } from "./triangle-wave-channel";

/**
 * 各チャンネルを保持して音をならす APU クラス。
 * 
 * TODO: 各チャンネルを同一I/Fで扱えるようにする。
 */
export class Apu {
    // $4017 書き込みで初期化されるひとたち
    private m_NextSeqPhase = 0;
    private m_SequencerCounter = 0;

    // $4017
    private m_SequencerMode = SequencerMode.Mode_4Step;
    private m_IrqEnabled = false;
    private m_IrqPending = false;

    // クロックたち、 CPU クロックでエミュレートする。 1 APU clock = 2 CPU clock
    private m_CpuClock = 0;

    // チャンネルたち
    private m_SquareWaveChannel1 = new SquareWaveChannel(0x4000, true);
    private m_SquareWaveChannel2 = new SquareWaveChannel(0x4004, false);

    private m_TriangleWaveChannel = new TriangleWaveChannel();

    private m_NoiseChannel = new NoiseChannel();

    private m_DmcChannel: DmcChannel;

    // 出力値
    private m_OutputVal = 0;

    // バス(割り込み用)
    private m_pApuBus: ApuBus;

    //  wave のサンプルを追加するコールバック
    private m_pAddWaveSample: (value: number) => void;
    private m_AddWaveSampleCounter = 0;
    private m_AddWaveSampleCounterMax = 40;

    constructor(pApuBus: ApuBus, pAddWaveSampleFunc: (value: number) => void) {
        this.m_pApuBus = pApuBus;
        this.m_DmcChannel = new DmcChannel(this);
        this.m_pAddWaveSample = pAddWaveSampleFunc;
    }

    // レジスタ 書き込み
    public writeRegister(value: number, addr: number): void {
        // addr で各チャンネルに振り分け
        if (addr <= 0x4003) {
            // 矩形波チャンネル1
            this.m_SquareWaveChannel1.WriteRegister(value, addr);
        }
        else if (addr <= 0x4007) {
            // 矩形波チャンネル2
            this.m_SquareWaveChannel2.WriteRegister(value, addr);
        }
        else if (addr <= 0x400B) {
            // 三角波
            this.m_TriangleWaveChannel.WriteRegister(value, addr);
        }
        else if (addr <= 0x400F) {
            // ノイズ
            this.m_NoiseChannel.WriteRegister(value, addr);
        }
        else if (addr <= 0x4013) {
            // DMC
            this.m_DmcChannel.WriteRegister(value, addr);
        }
        else if (addr == 0x4015) {
            // 全チャンネルに書き込みを反映
            this.m_SquareWaveChannel1.On4015Write(value);
            this.m_SquareWaveChannel2.On4015Write(value);
            this.m_TriangleWaveChannel.On4015Write(value);
            this.m_NoiseChannel.On4015Write(value);
            this.m_DmcChannel.On4015Write(value);
        }
        else if (addr == 0x4017) {
            // 設定値をメンバに反映 & 各チャンネル駆動
            // value の 7 bit 目が立ってたら 5 step else 4step
            this.m_SequencerMode = (value & (1 << 7)) == (1 << 7) ? SequencerMode.Mode_5Step : SequencerMode.Mode_4Step;
            this.m_IrqEnabled = ((value & (1 << 6)) >> 6) === 1;

            this.m_NextSeqPhase = 0;
            // フレームシーケンサのクロックは CPU クロックで計算する。(half clock を考慮するのをサボるため)
            this.m_SequencerCounter = ApuTable.ClocksToNextSequence;

            if (this.m_SequencerMode === SequencerMode.Mode_5Step) {
                this.ClockQuarterFrame();
                this.ClockHalfFrame();
            }

            if (!this.m_IrqEnabled) {
                this.m_IrqPending = false;
            }
        }
    }

    // CPU クロックを受け取ってその分だけ APU を動かす。 APU クロックでなく CPU クロック分であることに注意する。
    // DMA によって CPU が停止した場合、停止した CPU クロック数を返す
    public Run(cpuClock: number): number {
        let retCpuClock = 0;

        // cpuClock ぶんだけ APU うごかす
        for (let i = 0; i < cpuClock; i++) {
            if (this.m_CpuClock % 2 == 0) {
                // 1 APU サイクルごとに実行したい処理
                this.m_SquareWaveChannel1.ClockTimer();
                this.m_SquareWaveChannel2.ClockTimer();
                this.m_NoiseChannel.ClockTimer();
            }

            // 三角波 と DMC は 1 CPU クロックごとにタイマーをクロック
            this.m_TriangleWaveChannel.ClockTimer();
            retCpuClock += this.m_DmcChannel.ClockTimer();

            // clock frame sequencer
            // フレームシーケンサは CPU クロックベースで動く
            if (this.m_SequencerCounter > 0) {
                this.m_SequencerCounter--;
            }
            else {
                const [isQuarterFrame, isHalfFrame, isRaiseIrq] = this.GetPhaseStatus();

                if (isQuarterFrame) {
                    this.ClockQuarterFrame();
                }
                if (isHalfFrame) {
                    this.ClockHalfFrame();
                }
                if (isRaiseIrq) {
                    // TODO: CpuBus を使って IRQ 割り込みを上げる デバッグ
                    this.m_pApuBus.GenerateCpuInterrupt();
                    this.m_IrqPending = true;
                }

                this.StepSeqPhase();
                this.m_SequencerCounter = ApuTable.ClocksToNextSequence;
            }

            // 出力値の決定 (1 APU クロックごと)
            if (this.m_CpuClock % 2 == 0) {
                // TODO: ちゃんとミックスする
                this.m_OutputVal = 0;
                this.m_OutputVal += this.m_SquareWaveChannel1.GetOutPut();
                this.m_OutputVal += this.m_SquareWaveChannel2.GetOutPut();
                this.m_OutputVal += this.m_TriangleWaveChannel.GetOutPut();
                this.m_OutputVal += this.m_NoiseChannel.GetOutPut();
                // TORIAEZU: DMC だけ 7bit なのでほかと同じように4bitに丸める
                this.m_OutputVal += (this.m_DmcChannel.GetOutPut() >> 3);
            }

            // 40 or 41 クロックごとにコールバック関数で音を出力
            if (this.m_AddWaveSampleCounter >= this.m_AddWaveSampleCounterMax) {
                this.m_AddWaveSampleCounter = 0;
                this.m_AddWaveSampleCounterMax == 40 ? 41 : 40;
                this.m_pAddWaveSample(this.m_OutputVal);
            }

            this.m_AddWaveSampleCounter++;

            this.m_CpuClock++;
        }

        return retCpuClock;
    }

    // レジスタ 読み出し
    public readRegister4015(): number {
        let res = 0;

        const square1 = this.m_SquareWaveChannel1.GetStatusBit();
        res |= square1;

        const square2 = this.m_SquareWaveChannel2.GetStatusBit();
        res |= (square2 << 1);

        const triangle = this.m_TriangleWaveChannel.GetStatusBit();
        res |= (triangle << 2);

        const noise = this.m_NoiseChannel.GetStatusBit();
        res |= (noise << 3);

        // DMC だけは 1bit ではないので DMC 側に更新してもらう
        res = this.m_DmcChannel.GetStatusBit(res);

        return res;
    }

    // 出力値
    public GetOutPut(): number {
        return this.m_OutputVal;
    }

    // DMC 用 DMA Read
    public DmaReadFromCpu(addr: number): number {
        return this.m_pApuBus.ReadByte(addr);
    }

    // DMC 用 割り込みリクエスト
    public GenerateCpuInterrupt(): void {
        this.m_pApuBus.GenerateCpuInterrupt();
    }

    // ---- private methods ----

    // 各チャンネルたちを駆動するメソッド
    private ClockQuarterFrame(): void {
        // TODO 実装。
    }

    private ClockHalfFrame(): void {
        // TODO 実装。
    }


    // 内部実装
    // フレームシーケンサによって今なんの仕事をすべきかを返す
    private GetPhaseStatus(): [boolean, boolean, boolean] {
        // TODO 実装。

        // TODO 戻り引数の実装なので、以下を返す感じにする。
        let pIsQuaterFrame = false;
        let pIsHalfFrame = false;
        let pIsRaiseIrq = false;
        return [pIsQuaterFrame, pIsHalfFrame, pIsRaiseIrq];
    }

    // m_NextSeqPhase を mod Phase数 を考慮しつつ 1進める
    private StepSeqPhase(): void {
        // TODO 実装。
    }
}
