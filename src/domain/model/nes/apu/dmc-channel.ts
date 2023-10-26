import { Apu } from "./apu";
import { ApuTable } from "./apu-table";

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
        const offset = addr - this.m_BaseAddr;

        switch (offset) {
            case 0:
                this.m_DmcIrqEnabled = ((value >> 7) & 1) === 1;
                this.m_DmcLoop = ((value >> 6) & 1) === 1;
                this.m_FreqTimer = new ApuTable().g_DmcFreqTable[value & 0b1111];
                break;
            case 1:
                // デルタカウンタの初期値
                this.m_Output = value & 0b01111111;
                break;
            case 2:
                // DMCサンプリングを開始するとき、 アドレスカウンタにはレジスタ$4012 * $40 + $C000をセット(NES on FPGA)
                this.m_AddrLoad = 0xC000 + value * 0x40;
                break;
            case 3:
                // 残りバイトカウンタにはレジスタ$4013 * $10 + 1をセットします(NES on FPGA)
                this.m_LengthLoad = ((value) * 0x10) + 1;
                break;
            default:
                break;
        }
    }

    // APU 全体レジスタ($4015, $4017 の書き込みで反映される値)
    public On4015Write(value: number): void {
        if ((value >> 4) & 1) {
            this.m_Length = this.m_LengthLoad;
            this.m_Addr = this.m_AddrLoad;
        }
        else {
            this.m_Length = 0;
        }

        // 割り込みクリア
        this.m_DmcIrqPending = false;
    }

    // DMC の Status bit は length の割り込みフラグの2つあるので出力引数で出す
    public GetStatusBit(pOutValue: number): number {
        let orValue = 0;
        if (this.m_Length > 0) {
            orValue |= (1 << 4);
        }
        if (this.m_DmcIrqPending) {
            orValue |= (1 << 7);
        }
        return pOutValue | orValue;
    }

    // クロック(Apu クラスから呼び出すことを想定)
    // DMC はフレームシーケンサにクロックされることはない(？)のでタイマだけでOK
    // DMA で CPU が止まるかもしれないので止まった場合そのクロック数をかえす
    public ClockTimer(): number {
        let retCpuClock = 0;

        if (this.m_FreqCounter > 0) {
            this.m_FreqCounter--;
        }
        else {
            this.m_FreqCounter = this.m_FreqTimer;

            if (!this.m_OutputUnitSilent) {
                // サイレンスフラグがクリアされていたら
                if ((this.m_OutputShift & 1) && this.m_Output < 0x7e) {
                    // デルタカウンタが 126 より小さいなら +2
                    this.m_Output += 2;
                }
                if (!(this.m_OutputShift & 1) && this.m_Output > 1) {
                    // デルタカウンタが 1 より大きいなら -2
                    this.m_Output -= 2;
                }
            }

            // シフトレジスタに入っている使用済みサンプルを捨てる
            this.m_BitsInOutputUnit--;
            this.m_OutputShift >>= 1;

            if (this.m_BitsInOutputUnit == 0) {
                this.m_BitsInOutputUnit = 8;
                this.m_OutputShift = this.m_SampleBuffer;
                this.m_OutputUnitSilent = this.m_IsSampleBufferEmpty;
                this.m_IsSampleBufferEmpty = true;
            }

            // 必要なら DMA する
            if (this.m_Length > 0 && this.m_IsSampleBufferEmpty) {
                retCpuClock = 4;

                this.m_SampleBuffer = this.m_pApu!.DmaReadFromCpu(this.m_Addr);
                this.m_IsSampleBufferEmpty = false;

                this.m_Addr++;
                if (this.m_Addr > 0xFFFF) {
                    // 0xFFFF を超えてたら 0x8000 に丸める
                    this.m_Addr = 0x8000;
                }

                this.m_Length--;

                if (this.m_Length == 0) {
                    if (this.m_DmcLoop) {
                        this.m_Length = this.m_LengthLoad;
                        this.m_Addr = this.m_AddrLoad;
                    }
                    else if (this.m_DmcIrqEnabled) {
                        this.m_DmcIrqPending = true;
                        this.m_pApu!.GenerateCpuInterrupt();
                    }
                }
            }
        }

        return retCpuClock;
    }

    // 出力
    public GetOutPut(): number {
        return this.m_Output;
    }
}
