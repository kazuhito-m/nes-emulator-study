import { AddressingMode } from "../nes/cpu/addresing-mode";
import { CpuInfo } from "../nes/cpu/cpu-info";
import { Instruction } from "../nes/cpu/instruction";
import { Opcode } from "../nes/cpu/opcode";

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