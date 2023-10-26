import { AddressingMode } from "./addresing-mode";
import { Opcode } from "./opcode";

export class Instruction {
    constructor(
        public m_Opcode: Opcode,
        public m_AddressingMode: AddressingMode,
        public m_Bytes: number,
        public m_Cycles: number
    ) { }

    public static from(byte: number): Instruction {
        switch (byte) {
            case 0x69:
                return new Instruction(Opcode.ADC, AddressingMode.Immediate, 2, 2);
            case 0x65:
                return new Instruction(Opcode.ADC, AddressingMode.ZeroPage, 2, 3);
            case 0x75:
                return new Instruction(Opcode.ADC, AddressingMode.ZeroPageX, 2, 4);
            case 0x6D:
                return new Instruction(Opcode.ADC, AddressingMode.Absolute, 3, 4);
            case 0x7D:
                return new Instruction(Opcode.ADC, AddressingMode.AbsoluteX, 3, 4);
            case 0x79:
                return new Instruction(Opcode.ADC, AddressingMode.AbsoluteY, 3, 4);
            case 0x61:
                return new Instruction(Opcode.ADC, AddressingMode.IndirectX, 2, 6);
            case 0x71:
                return new Instruction(Opcode.ADC, AddressingMode.IndirectY, 2, 5);
            case 0x29:
                return new Instruction(Opcode.AND, AddressingMode.Immediate, 2, 2);
            case 0x25:
                return new Instruction(Opcode.AND, AddressingMode.ZeroPage, 2, 3);
            case 0x35:
                return new Instruction(Opcode.AND, AddressingMode.ZeroPageX, 2, 4);
            case 0x2D:
                return new Instruction(Opcode.AND, AddressingMode.Absolute, 3, 4);
            case 0x3D:
                return new Instruction(Opcode.AND, AddressingMode.AbsoluteX, 3, 4);
            case 0x39:
                return new Instruction(Opcode.AND, AddressingMode.AbsoluteY, 3, 4);
            case 0x21:
                return new Instruction(Opcode.AND, AddressingMode.IndirectX, 2, 6);
            case 0x31:
                return new Instruction(Opcode.AND, AddressingMode.IndirectY, 2, 5);
            case 0x0A:
                return new Instruction(Opcode.ASL, AddressingMode.Accumulator, 1, 2);
            case 0x06:
                return new Instruction(Opcode.ASL, AddressingMode.ZeroPage, 2, 5);
            case 0x16:
                return new Instruction(Opcode.ASL, AddressingMode.ZeroPageX, 2, 6);
            case 0x0E:
                return new Instruction(Opcode.ASL, AddressingMode.Absolute, 3, 6);
            case 0x1E:
                return new Instruction(Opcode.ASL, AddressingMode.AbsoluteX, 3, 7);
            case 0x90:
                return new Instruction(Opcode.BCC, AddressingMode.Relative, 2, 2);
            case 0xB0:
                return new Instruction(Opcode.BCS, AddressingMode.Relative, 2, 2);
            case 0xF0:
                return new Instruction(Opcode.BEQ, AddressingMode.Relative, 2, 2);
            case 0x24:
                return new Instruction(Opcode.BIT, AddressingMode.ZeroPage, 2, 3);
            case 0x2C:
                return new Instruction(Opcode.BIT, AddressingMode.Absolute, 3, 4);
            case 0x30:
                return new Instruction(Opcode.BMI, AddressingMode.Relative, 2, 2);
            case 0xD0:
                return new Instruction(Opcode.BNE, AddressingMode.Relative, 2, 2);
            case 0x10:
                return new Instruction(Opcode.BPL, AddressingMode.Relative, 2, 2);
            case 0x00:
                return new Instruction(Opcode.BRK, AddressingMode.Implied, 1, 7);
            case 0x50:
                return new Instruction(Opcode.BVC, AddressingMode.Relative, 2, 2);
            case 0x70:
                return new Instruction(Opcode.BVS, AddressingMode.Relative, 2, 2);
            case 0x18:
                return new Instruction(Opcode.CLC, AddressingMode.Implied, 1, 2);
            case 0xD8:
                return new Instruction(Opcode.CLD, AddressingMode.Implied, 1, 2);
            case 0x58:
                return new Instruction(Opcode.CLI, AddressingMode.Implied, 1, 2);
            case 0xB8:
                return new Instruction(Opcode.CLV, AddressingMode.Implied, 1, 2);
            case 0xC9:
                return new Instruction(Opcode.CMP, AddressingMode.Immediate, 2, 2);
            case 0xC5:
                return new Instruction(Opcode.CMP, AddressingMode.ZeroPage, 2, 3);
            case 0xD5:
                return new Instruction(Opcode.CMP, AddressingMode.ZeroPageX, 2, 4);
            case 0xCD:
                return new Instruction(Opcode.CMP, AddressingMode.Absolute, 3, 4);
            case 0xDD:
                return new Instruction(Opcode.CMP, AddressingMode.AbsoluteX, 3, 4);
            case 0xD9:
                return new Instruction(Opcode.CMP, AddressingMode.AbsoluteY, 3, 4);
            case 0xC1:
                return new Instruction(Opcode.CMP, AddressingMode.IndirectX, 2, 6);
            case 0xD1:
                return new Instruction(Opcode.CMP, AddressingMode.IndirectY, 2, 5);
            case 0xE0:
                return new Instruction(Opcode.CPX, AddressingMode.Immediate, 2, 2);
            case 0xE4:
                return new Instruction(Opcode.CPX, AddressingMode.ZeroPage, 2, 3);
            case 0xEC:
                return new Instruction(Opcode.CPX, AddressingMode.Absolute, 3, 4);
            case 0xC0:
                return new Instruction(Opcode.CPY, AddressingMode.Immediate, 2, 2);
            case 0xC4:
                return new Instruction(Opcode.CPY, AddressingMode.ZeroPage, 2, 3);
            case 0xCC:
                return new Instruction(Opcode.CPY, AddressingMode.Absolute, 3, 4);
            case 0xC6:
                return new Instruction(Opcode.DEC, AddressingMode.ZeroPage, 2, 5);
            case 0xD6:
                return new Instruction(Opcode.DEC, AddressingMode.ZeroPageX, 2, 6);
            case 0xCE:
                return new Instruction(Opcode.DEC, AddressingMode.Absolute, 3, 6);
            case 0xDE:
                return new Instruction(Opcode.DEC, AddressingMode.AbsoluteX, 3, 7);
            case 0xCA:
                return new Instruction(Opcode.DEX, AddressingMode.Implied, 1, 2);
            case 0x88:
                return new Instruction(Opcode.DEY, AddressingMode.Implied, 1, 2);
            case 0x49:
                return new Instruction(Opcode.EOR, AddressingMode.Immediate, 2, 2);
            case 0x45:
                return new Instruction(Opcode.EOR, AddressingMode.ZeroPage, 2, 3);
            case 0x55:
                return new Instruction(Opcode.EOR, AddressingMode.ZeroPageX, 2, 4);
            case 0x4D:
                return new Instruction(Opcode.EOR, AddressingMode.Absolute, 3, 4);
            case 0x5D:
                return new Instruction(Opcode.EOR, AddressingMode.AbsoluteX, 3, 4);
            case 0x59:
                return new Instruction(Opcode.EOR, AddressingMode.AbsoluteY, 3, 4);
            case 0x41:
                return new Instruction(Opcode.EOR, AddressingMode.IndirectX, 2, 6);
            case 0x51:
                return new Instruction(Opcode.EOR, AddressingMode.IndirectY, 2, 5);
            case 0xE6:
                return new Instruction(Opcode.INC, AddressingMode.ZeroPage, 2, 5);
            case 0xF6:
                return new Instruction(Opcode.INC, AddressingMode.ZeroPageX, 2, 6);
            case 0xEE:
                return new Instruction(Opcode.INC, AddressingMode.Absolute, 3, 6);
            case 0xFE:
                return new Instruction(Opcode.INC, AddressingMode.AbsoluteX, 3, 7);
            case 0xE8:
                return new Instruction(Opcode.INX, AddressingMode.Implied, 1, 2);
            case 0xC8:
                return new Instruction(Opcode.INY, AddressingMode.Implied, 1, 2);
            case 0x4C:
                return new Instruction(Opcode.JMP, AddressingMode.Absolute, 3, 3);
            case 0x6C:
                return new Instruction(Opcode.JMP, AddressingMode.Indirect, 3, 5);
            case 0x20:
                return new Instruction(Opcode.JSR, AddressingMode.Absolute, 3, 6);
            case 0xA9:
                return new Instruction(Opcode.LDA, AddressingMode.Immediate, 2, 2);
            case 0xA5:
                return new Instruction(Opcode.LDA, AddressingMode.ZeroPage, 2, 3);
            case 0xB5:
                return new Instruction(Opcode.LDA, AddressingMode.ZeroPageX, 2, 4);
            case 0xAD:
                return new Instruction(Opcode.LDA, AddressingMode.Absolute, 3, 4);
            case 0xBD:
                return new Instruction(Opcode.LDA, AddressingMode.AbsoluteX, 3, 4);
            case 0xB9:
                return new Instruction(Opcode.LDA, AddressingMode.AbsoluteY, 3, 4);
            case 0xA1:
                return new Instruction(Opcode.LDA, AddressingMode.IndirectX, 2, 6);
            case 0xB1:
                return new Instruction(Opcode.LDA, AddressingMode.IndirectY, 2, 5);
            case 0xA2:
                return new Instruction(Opcode.LDX, AddressingMode.Immediate, 2, 2);
            case 0xA6:
                return new Instruction(Opcode.LDX, AddressingMode.ZeroPage, 2, 3);
            case 0xB6:
                return new Instruction(Opcode.LDX, AddressingMode.ZeroPageY, 2, 4);
            case 0xAE:
                return new Instruction(Opcode.LDX, AddressingMode.Absolute, 3, 4);
            case 0xBE:
                return new Instruction(Opcode.LDX, AddressingMode.AbsoluteY, 3, 4);
            case 0xA0:
                return new Instruction(Opcode.LDY, AddressingMode.Immediate, 2, 2);
            case 0xA4:
                return new Instruction(Opcode.LDY, AddressingMode.ZeroPage, 2, 3);
            case 0xB4:
                return new Instruction(Opcode.LDY, AddressingMode.ZeroPageX, 2, 4);
            case 0xAC:
                return new Instruction(Opcode.LDY, AddressingMode.Absolute, 3, 4);
            case 0xBC:
                return new Instruction(Opcode.LDY, AddressingMode.AbsoluteX, 3, 4);
            case 0x4A:
                return new Instruction(Opcode.LSR, AddressingMode.Accumulator, 1, 2);
            case 0x46:
                return new Instruction(Opcode.LSR, AddressingMode.ZeroPage, 2, 5);
            case 0x56:
                return new Instruction(Opcode.LSR, AddressingMode.ZeroPageX, 2, 6);
            case 0x4E:
                return new Instruction(Opcode.LSR, AddressingMode.Absolute, 3, 6);
            case 0x5E:
                return new Instruction(Opcode.LSR, AddressingMode.AbsoluteX, 3, 7);
            case 0xEA:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0x09:
                return new Instruction(Opcode.ORA, AddressingMode.Immediate, 2, 2);
            case 0x05:
                return new Instruction(Opcode.ORA, AddressingMode.ZeroPage, 2, 3);
            case 0x15:
                return new Instruction(Opcode.ORA, AddressingMode.ZeroPageX, 2, 4);
            case 0x0D:
                return new Instruction(Opcode.ORA, AddressingMode.Absolute, 3, 4);
            case 0x1D:
                return new Instruction(Opcode.ORA, AddressingMode.AbsoluteX, 3, 4);
            case 0x19:
                return new Instruction(Opcode.ORA, AddressingMode.AbsoluteY, 3, 4);
            case 0x01:
                return new Instruction(Opcode.ORA, AddressingMode.IndirectX, 2, 6);
            case 0x11:
                return new Instruction(Opcode.ORA, AddressingMode.IndirectY, 2, 5);
            case 0x48:
                return new Instruction(Opcode.PHA, AddressingMode.Implied, 1, 3);
            case 0x08:
                return new Instruction(Opcode.PHP, AddressingMode.Implied, 1, 3);
            case 0x68:
                return new Instruction(Opcode.PLA, AddressingMode.Implied, 1, 4);
            case 0x28:
                return new Instruction(Opcode.PLP, AddressingMode.Implied, 1, 4);
            case 0x2A:
                return new Instruction(Opcode.ROL, AddressingMode.Accumulator, 1, 2);
            case 0x26:
                return new Instruction(Opcode.ROL, AddressingMode.ZeroPage, 2, 5);
            case 0x36:
                return new Instruction(Opcode.ROL, AddressingMode.ZeroPageX, 2, 6);
            case 0x2E:
                return new Instruction(Opcode.ROL, AddressingMode.Absolute, 3, 6);
            case 0x3E:
                return new Instruction(Opcode.ROL, AddressingMode.AbsoluteX, 3, 7);
            case 0x6A:
                return new Instruction(Opcode.ROR, AddressingMode.Accumulator, 1, 2);
            case 0x66:
                return new Instruction(Opcode.ROR, AddressingMode.ZeroPage, 2, 5);
            case 0x76:
                return new Instruction(Opcode.ROR, AddressingMode.ZeroPageX, 2, 6);
            case 0x6E:
                return new Instruction(Opcode.ROR, AddressingMode.Absolute, 3, 6);
            case 0x7E:
                return new Instruction(Opcode.ROR, AddressingMode.AbsoluteX, 3, 7);
            case 0x40:
                return new Instruction(Opcode.RTI, AddressingMode.Implied, 1, 6);
            case 0x60:
                return new Instruction(Opcode.RTS, AddressingMode.Implied, 1, 6);
            case 0xE9:
                return new Instruction(Opcode.SBC, AddressingMode.Immediate, 2, 2);
            case 0xE5:
                return new Instruction(Opcode.SBC, AddressingMode.ZeroPage, 2, 3);
            case 0xF5:
                return new Instruction(Opcode.SBC, AddressingMode.ZeroPageX, 2, 4);
            case 0xED:
                return new Instruction(Opcode.SBC, AddressingMode.Absolute, 3, 4);
            case 0xFD:
                return new Instruction(Opcode.SBC, AddressingMode.AbsoluteX, 3, 4);
            case 0xF9:
                return new Instruction(Opcode.SBC, AddressingMode.AbsoluteY, 3, 4);
            case 0xE1:
                return new Instruction(Opcode.SBC, AddressingMode.IndirectX, 2, 6);
            case 0xF1:
                return new Instruction(Opcode.SBC, AddressingMode.IndirectY, 2, 5);
            case 0x38:
                return new Instruction(Opcode.SEC, AddressingMode.Implied, 1, 2);
            case 0xF8:
                return new Instruction(Opcode.SED, AddressingMode.Implied, 1, 2);
            case 0x78:
                return new Instruction(Opcode.SEI, AddressingMode.Implied, 1, 2);
            case 0x85:
                return new Instruction(Opcode.STA, AddressingMode.ZeroPage, 2, 3);
            case 0x95:
                return new Instruction(Opcode.STA, AddressingMode.ZeroPageX, 2, 4);
            case 0x8D:
                return new Instruction(Opcode.STA, AddressingMode.Absolute, 3, 4);
            case 0x9D:
                return new Instruction(Opcode.STA, AddressingMode.AbsoluteX, 3, 5);
            case 0x99:
                return new Instruction(Opcode.STA, AddressingMode.AbsoluteY, 3, 5);
            case 0x81:
                return new Instruction(Opcode.STA, AddressingMode.IndirectX, 2, 6);
            case 0x91:
                return new Instruction(Opcode.STA, AddressingMode.IndirectY, 2, 6);
            case 0x86:
                return new Instruction(Opcode.STX, AddressingMode.ZeroPage, 2, 3);
            case 0x96:
                return new Instruction(Opcode.STX, AddressingMode.ZeroPageY, 2, 4);
            case 0x8E:
                return new Instruction(Opcode.STX, AddressingMode.Absolute, 3, 4);
            case 0x84:
                return new Instruction(Opcode.STY, AddressingMode.ZeroPage, 2, 3);
            case 0x94:
                return new Instruction(Opcode.STY, AddressingMode.ZeroPageX, 2, 4);
            case 0x8C:
                return new Instruction(Opcode.STY, AddressingMode.Absolute, 3, 4);
            case 0xAA:
                return new Instruction(Opcode.TAX, AddressingMode.Implied, 1, 2);
            case 0xA8:
                return new Instruction(Opcode.TAY, AddressingMode.Implied, 1, 2);
            case 0xBA:
                return new Instruction(Opcode.TSX, AddressingMode.Implied, 1, 2);
            case 0x8A:
                return new Instruction(Opcode.TXA, AddressingMode.Implied, 1, 2);
            case 0x9A:
                return new Instruction(Opcode.TXS, AddressingMode.Implied, 1, 2);
            case 0x98:
                return new Instruction(Opcode.TYA, AddressingMode.Implied, 1, 2);
            // unofficial opcodes
            case 0x4B:
                return new Instruction(Opcode.ALR, AddressingMode.Immediate, 2, 2);
            case 0x0B:
                return new Instruction(Opcode.ANC, AddressingMode.Immediate, 2, 2);
            case 0x6B:
                return new Instruction(Opcode.ARR, AddressingMode.Immediate, 2, 2);
            case 0xCB:
                return new Instruction(Opcode.AXS, AddressingMode.Immediate, 2, 2);
            case 0xA3:
                return new Instruction(Opcode.LAX, AddressingMode.IndirectX, 2, 6);
            case 0xA7:
                return new Instruction(Opcode.LAX, AddressingMode.ZeroPage, 2, 3);
            case 0xAF:
                return new Instruction(Opcode.LAX, AddressingMode.Absolute, 3, 4);
            case 0xB3:
                return new Instruction(Opcode.LAX, AddressingMode.IndirectY, 2, 5);
            case 0xB7:
                return new Instruction(Opcode.LAX, AddressingMode.ZeroPageY, 2, 4);
            case 0xBF:
                return new Instruction(Opcode.LAX, AddressingMode.AbsoluteY, 3, 4);
            case 0x83:
                return new Instruction(Opcode.SAX, AddressingMode.IndirectX, 2, 6);
            case 0x87:
                return new Instruction(Opcode.SAX, AddressingMode.ZeroPage, 2, 3);
            case 0x8F:
                return new Instruction(Opcode.SAX, AddressingMode.Absolute, 3, 4);
            case 0x97:
                return new Instruction(Opcode.SAX, AddressingMode.ZeroPageY, 2, 4);
            case 0xC3:
                return new Instruction(Opcode.DCP, AddressingMode.IndirectX, 2, 8);
            case 0xC7:
                return new Instruction(Opcode.DCP, AddressingMode.ZeroPage, 2, 5);
            case 0xCF:
                return new Instruction(Opcode.DCP, AddressingMode.Absolute, 3, 6);
            case 0xD3:
                return new Instruction(Opcode.DCP, AddressingMode.IndirectY, 2, 8);
            case 0xD7:
                return new Instruction(Opcode.DCP, AddressingMode.ZeroPageX, 2, 6);
            case 0xDB:
                return new Instruction(Opcode.DCP, AddressingMode.AbsoluteY, 3, 7);
            case 0xDF:
                return new Instruction(Opcode.DCP, AddressingMode.AbsoluteX, 3, 7);
            case 0xE3:
                return new Instruction(Opcode.ISC, AddressingMode.IndirectX, 2, 8);
            case 0xE7:
                return new Instruction(Opcode.ISC, AddressingMode.ZeroPage, 2, 5);
            case 0xEF:
                return new Instruction(Opcode.ISC, AddressingMode.Absolute, 3, 6);
            case 0xF3:
                return new Instruction(Opcode.ISC, AddressingMode.IndirectY, 2, 8);
            case 0xF7:
                return new Instruction(Opcode.ISC, AddressingMode.ZeroPageX, 2, 6);
            case 0xFB:
                return new Instruction(Opcode.ISC, AddressingMode.AbsoluteY, 3, 7);
            case 0xFF:
                return new Instruction(Opcode.ISC, AddressingMode.AbsoluteX, 3, 7);
            case 0x23:
                return new Instruction(Opcode.RLA, AddressingMode.IndirectX, 2, 8);
            case 0x27:
                return new Instruction(Opcode.RLA, AddressingMode.ZeroPage, 2, 5);
            case 0x2F:
                return new Instruction(Opcode.RLA, AddressingMode.Absolute, 3, 6);
            case 0x33:
                return new Instruction(Opcode.RLA, AddressingMode.IndirectY, 2, 8);
            case 0x37:
                return new Instruction(Opcode.RLA, AddressingMode.ZeroPageX, 2, 6);
            case 0x3B:
                return new Instruction(Opcode.RLA, AddressingMode.AbsoluteY, 3, 7);
            case 0x3F:
                return new Instruction(Opcode.RLA, AddressingMode.AbsoluteX, 3, 7);
            case 0x63:
                return new Instruction(Opcode.RRA, AddressingMode.IndirectX, 2, 8);
            case 0x67:
                return new Instruction(Opcode.RRA, AddressingMode.ZeroPage, 2, 5);
            case 0x6F:
                return new Instruction(Opcode.RRA, AddressingMode.Absolute, 3, 6);
            case 0x73:
                return new Instruction(Opcode.RRA, AddressingMode.IndirectY, 2, 8);
            case 0x77:
                return new Instruction(Opcode.RRA, AddressingMode.ZeroPageX, 2, 6);
            case 0x7B:
                return new Instruction(Opcode.RRA, AddressingMode.AbsoluteY, 3, 7);
            case 0x7F:
                return new Instruction(Opcode.RRA, AddressingMode.AbsoluteX, 3, 7);
            case 0x03:
                return new Instruction(Opcode.SLO, AddressingMode.IndirectX, 2, 8);
            case 0x07:
                return new Instruction(Opcode.SLO, AddressingMode.ZeroPage, 2, 5);
            case 0x0F:
                return new Instruction(Opcode.SLO, AddressingMode.Absolute, 3, 6);
            case 0x13:
                return new Instruction(Opcode.SLO, AddressingMode.IndirectY, 2, 8);
            case 0x17:
                return new Instruction(Opcode.SLO, AddressingMode.ZeroPageX, 2, 6);
            case 0x1B:
                return new Instruction(Opcode.SLO, AddressingMode.AbsoluteY, 3, 7);
            case 0x1F:
                return new Instruction(Opcode.SLO, AddressingMode.AbsoluteX, 3, 7);
            case 0x43:
                return new Instruction(Opcode.SRE, AddressingMode.IndirectX, 2, 8);
            case 0x47:
                return new Instruction(Opcode.SRE, AddressingMode.ZeroPage, 2, 5);
            case 0x4F:
                return new Instruction(Opcode.SRE, AddressingMode.Absolute, 3, 6);
            case 0x53:
                return new Instruction(Opcode.SRE, AddressingMode.IndirectY, 2, 8);
            case 0x57:
                return new Instruction(Opcode.SRE, AddressingMode.ZeroPageX, 2, 6);
            case 0x5B:
                return new Instruction(Opcode.SRE, AddressingMode.AbsoluteY, 3, 7);
            case 0x5F:
                return new Instruction(Opcode.SRE, AddressingMode.AbsoluteX, 3, 7);
            // Duplicated Instructions
            // ADC は SBC で代用されることに注意する
            case 0xEB:
                return new Instruction(Opcode.SBC, AddressingMode.Immediate, 2, 2);
            // NOPs
            case 0x1A:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0x3A:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0x5A:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0x7A:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0xDA:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0xFA:
                return new Instruction(Opcode.NOP, AddressingMode.Implied, 1, 2);
            case 0x80:
                return new Instruction(Opcode.SKB, AddressingMode.Immediate, 2, 2);
            case 0x82:
                return new Instruction(Opcode.SKB, AddressingMode.Immediate, 2, 2);
            case 0x89:
                return new Instruction(Opcode.SKB, AddressingMode.Immediate, 2, 2);
            case 0xC2:
                return new Instruction(Opcode.SKB, AddressingMode.Immediate, 2, 2);
            case 0xE2:
                return new Instruction(Opcode.SKB, AddressingMode.Immediate, 2, 2);
            // IGN もページクロスで +1 クロック？
            case 0x0C:
                return new Instruction(Opcode.IGN, AddressingMode.Absolute, 3, 4);
            case 0x1C:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0x3C:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0x5C:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0x7C:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0xDC:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0xFC:
                return new Instruction(Opcode.IGN, AddressingMode.AbsoluteX, 3, 4);
            case 0x04:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPage, 2, 3);
            case 0x44:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPage, 2, 3);
            case 0x64:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPage, 2, 3);
            case 0x14:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            case 0x34:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            case 0x54:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            case 0x74:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            case 0xD4:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            case 0xF4:
                return new Instruction(Opcode.IGN, AddressingMode.ZeroPageX, 2, 4);
            // CLD, CLV, SED は必要なら実装する

            default:
                // abort();
                throw new Error('abort()');
                break;
        }
    }
}
