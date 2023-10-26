import { AddressingMode } from "./cpu/addresing-mode";
import { CpuInfo } from "./cpu/cpu-info";
import { Instruction } from "./cpu/instruction";
import { Opcode } from "./cpu/opcode";

export class EmuInfo {
	constructor(
		// 雑に規定値を渡しておく
		public cpuInfo = new CpuInfo(
			0,
			0,
			0,
			0,
			0,
			0,
			new Instruction(
				Opcode.ADC,
				AddressingMode.Immediate,
				0,
				0
			),
			[0],
			0
		),
		public PpuLines = 0,
		public PpuCycles = 0,
		public CpuCycles = 0,
		public CpuInstructionCount = 0,
	) { }
}