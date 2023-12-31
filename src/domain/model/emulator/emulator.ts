import { Apu } from "../nes/apu/apu";
import { ApuBus } from "../nes/apu/apu-bus";
import { Color } from "./color";
import { ColorConvertTable } from "./color-convert-table";
import { Constants } from "../nes/constants";
import { initializeTwoDimensionalArray } from "../nes/cpp-functions";
import { Cpu } from "../nes/cpu/cpu";
import { CpuBus } from "../nes/cpu/cpu-bus";
import { InterruptType } from "../nes/cpu/interrupt-type";
import { EmuInfo } from "./emu-info";
import { PadButton, PadId } from "../nes/input/pad/pad";
import { Ppu } from "../nes/ppu/ppu";
import { PpuBus } from "../nes/ppu/ppu-bus";
import { PpuSystem } from "../nes/ppu/ppu-system";
import { System } from "../nes/system";

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

    private readonly colorConvertTable = new ColorConvertTable();

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

    public getColor(color: number): Color {
        return this.colorConvertTable.get(color);
    }

    /** 1フレーム進める。 */
    public stepFrame(): void {
        let finished = false;
        while (!finished) {
            // DMA 稼働中は CPU 止まるので、これでつじつまが合う
            const dmaClk = this.m_CpuBus.runDma(this.m_ClockCount);
            const add = this.m_Cpu.run();
            this.m_ClockCount += dmaClk;
            this.m_ClockCount += add;
            finished = this.m_Ppu.run(add * 3);
            // TODO: Apu の DMA が CPU を止めることを考慮する
            this.m_Apu.run(add);
            this.m_InstructionCount++;
        }
    }

    /** 1命令進める、1 フレーム完成してたら true が返る。 */
    public Step(): boolean {
        // DMA 稼働中は CPU 止まるので、これでつじつまが合う
        const dmaClk = this.m_CpuBus.runDma(this.m_ClockCount);
        const add = this.m_Cpu.run();
        this.m_ClockCount += dmaClk;
        this.m_ClockCount += add;
        const ret = this.m_Ppu.run(add * 3);
        this.m_Apu.run(add);
        this.m_InstructionCount++;

        return ret;
    }

    /** テーブル変換前の絵を取得。 */
    public getPicture(pBuffer: number[][] /* [240][256] */): void {
        this.m_Ppu.getPpuOutput(pBuffer);
    }

    /** テーブル変換後の絵を取得。 */
    public getPictureColor(pBuffer: Color[][]  /* [240][256] */): void {
        const raw = initializeTwoDimensionalArray<number>(Constants.PPU_OUTPUT_Y, Constants.PPU_OUTPUT_X);
        this.m_Ppu.getPpuOutput(raw);
        for (let y = 0; y < Constants.PPU_OUTPUT_Y; y++) {
            for (let x = 0; x < Constants.PPU_OUTPUT_X; x++) {
                pBuffer[y][x] = this.getColor(raw[y][x]);
            }
        }
    }


    // TODO: RAM, VRAM もとれるようにする

    /** CPU と PPU の情報を取得。 */
    public GetEmuInfo(pOutInfo: EmuInfo): void {
        pOutInfo.cpuInfo = this.m_Cpu.getCpuInfoForDebug();

        const [lines, cycles] = this.m_Ppu.getPpuInfo();
        pOutInfo.PpuLines = lines;
        pOutInfo.PpuCycles = cycles;

        pOutInfo.CpuCycles = this.m_ClockCount;
        pOutInfo.CpuInstructionCount = this.m_InstructionCount;
    }


    /** Pad のボタン押す。 */
    public PushButton(id: PadId, button: PadButton): void {
        this.m_System.pushButton(id, button);
    }

    public ReleaseButton(id: PadId, button: PadButton): void {
        this.m_System.releaseButton(id, button);
    }
}
