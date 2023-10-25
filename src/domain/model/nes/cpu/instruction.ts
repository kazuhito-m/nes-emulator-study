import { AddressingMode, Opcode } from "./cpu";

export class Instruction {
    constructor(
        private m_Opcode: Opcode,
        private m_AddressingMode: AddressingMode,
        public m_Bytes: number,
        private m_Cycles: number
    ) { }
}