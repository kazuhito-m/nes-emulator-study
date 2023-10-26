import { Constants } from "../constants";
import { Cpu } from "../cpu/cpu";
import { InterruptType } from "../cpu/interrupt-type";
import { System } from "../system";

export class ApuBus {
    // CPU にバスを繋ぐ
    private m_pCpu?: Cpu;
    // System にもバスを繋ぐ(DMA でカセットの内容を読み取るため)
    private m_pSystem: System;
    private m_IsInitialized = false;

    constructor(pSystem: System) {
        this.m_pSystem = pSystem;
    }

    // オブジェクト生成時の循環依存を切るため、 Initialize で Cpu へのポインタを渡す
    public initialize(pCpu: Cpu): void {
        this.m_pCpu = pCpu;
        this.m_IsInitialized = true;
    }

    // フレームシーケンサが CPU に IRQ いれる
    public GenerateCpuInterrupt(): void {
        if (!this.m_IsInitialized) throw new Error('Invalid operation. ApuBus not initialized.');
        this.m_pCpu?.interrupt(InterruptType.IRQ);
    }

    // CPU メモリ空間から読み込む(DMC の DMA 用)
    // APU から DMA で CPU メモリ空間の値を読み込む
    public ReadByte(addr: number): number {
        if (!this.m_IsInitialized) throw new Error('Invalid operation. ApuBus not initialized.');
        // DMC 用 DMA
        // $4012 書き込み時の挙動と wrap の挙動から、DMA で読むアドレスは $8000 以降(つまり、 PRG ROM しかよまない)のはず、 assert しとく
        if (addr < Constants.CASSETTE_PRG_ROM_BASE) throw new Error('Out of range Address.');
        const offset = addr - Constants.CASSETTE_PRG_ROM_BASE;

        let res = [0];
        this.m_pSystem.m_Cassette.readPrgRom(res, offset, 1);
        return res[0];
    }
}
