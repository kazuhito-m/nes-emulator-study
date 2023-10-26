import { Apu } from "./apu/apu";
import { ApuBus } from "./apu/apu-bus";
import { Color } from "./color";
import { Cpu } from "./cpu/cpu";
import { CpuBus } from "./cpu/cpu-bus";
import { InterruptType } from "./cpu/interrupt-type";
import { EmuInfo } from "./emu-info";
import { PadButton, PadId } from "./input/pad/pad";
import { Ppu } from "./ppu/ppu";
import { PpuBus } from "./ppu/ppu-bus";
import { PpuSystem } from "./ppu/ppu-system";
import { System } from "./system";

export class Emulator {

    private readonly m_Rom: number[];

    private readonly m_System: System;
    private readonly m_PpuSystem: PpuSystem;
    private readonly m_PpuBus: PpuBus;;
    private readonly m_Ppu: Ppu;
    private readonly m_ApuBus: ApuBus;
    private readonly m_Apu: Apu;
    private readonly m_CpuBus: CpuBus;
    private readonly m_Cpu: Cpu;

    private m_ClockCount = 7;
    private m_InstructionCount = 1;

    constructor(rom: number[], romSize: number, pAddWaveSampleFunc: (value: number) => void) {
        this.m_Rom = rom;
        this.m_System = new System(rom, romSize);
        this.m_PpuSystem = new PpuSystem();
        this.m_PpuBus = new PpuBus(this.m_System, this.m_PpuSystem);
        this.m_Ppu = new Ppu(this.m_PpuBus);
        this.m_ApuBus = new ApuBus(this.m_System);
        this.m_Apu = new Apu(this.m_ApuBus, pAddWaveSampleFunc);
        this.m_CpuBus = new CpuBus(this.m_System, this.m_Ppu, this.m_Apu);
        this.m_Cpu = new Cpu(this.m_CpuBus)

        // コンストラクタで渡すと循環依存になってしまうのでここだけ Initialize で渡す
        this.m_PpuBus.initialize(this.m_Cpu);
        this.m_ApuBus.initialize(this.m_Cpu);
        // Reset 割り込み
        this.m_Cpu.interrupt(InterruptType.RESET);
    }

    public GetColor(src: number): Color {
        // TODO 実装。
    }

    /** 1フレーム進める。 */
    public StepFrame(): void {
        // TODO 実装。
    }

    /** 1命令進める、1 フレーム完成してたら true が返る。 */
    public Step(): booloon {
        // TODO 実装。
    }

    /** テーブル変換前の絵を取得。 */
    public GetPicture(pBuffer: number[][] /* [240][256] */): void {
        // TODO 実装。
    }

    /** テーブル変換後の絵を取得。 */
    public GetPictureColorA(pBuffer: Color[][]  /* [240][256] */): void {
        // TODO 実装。
    }


    // TODO: RAM, VRAM もとれるようにする

    /** CPU と PPU の情報を取得。 */
    public GetEmuInfo(pOutInfo: EmuInfo): void {
        // TODO 実装。
    }


    /** Pad のボタン押す。 */
    public PushButton(id: PadId, button: PadButton): void {
        // TODO 実装。
    }

    public ReleaseButton(id: PadId, button: PadButton): void {
        // TODO 実装。
    }

}
