import { Constants } from "../constants";
import { AddressingMode } from "./addresing-mode";
import { CpuBus } from "./cpu-bus";
import { CpuInfo } from "./cpu-info";
import { Instruction } from "./instruction";
import { InterruptType } from "./interrupt-type";
import { Opcode } from "./opcode";

export class Cpu {
    // レジスタ名は命名規則に従わない
    private A: number = 0;
    private X: number = 0;
    private Y: number = 0;
    private PC: number = 0;
    private SP: number = 0xFF;
    // 下から順番に、 CZIDB1VN
    private P: number = 1 << 5;

    // CPU BUS 経由でシステムを読み書きする
    private m_pCpuBus: CpuBus;

    constructor(pCpuBus: CpuBus) {
        this.m_pCpuBus = pCpuBus;
    }

    // 1命令実行し、実行にかかったクロックを返す
    public run(): number {
        // 命令 フェッチ
        const instByte = this.m_pCpuBus.readByte(this.PC);
        const inst = Instruction.from(instByte);
        // TODO: 命令実行前に命令の disas と今の状態をログに出す

        switch (inst.m_Opcode) {
            case Opcode.ADC:
                {
                    // オペランド フェッチ
                    const [operand, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const calc = this.A + operand + (this.getCarryFlag() ? 1 : 0);
                    const res = calc;

                    this.SetCarryFlag(calc > 0xff);
                    this.SetZeroFlag(res === 0);
                    this.setNegativeFlag((res & 0x80) === 0x80);
                    // http://forums.nesdev.com/viewtopic.php?t=6331
                    this.setOverflowFlag(this.isSignedOverFlowed(this.A, operand, this.getCarryFlag()));

                    this.A = res;
                    // PC 進める
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.AND:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = this.A & arg;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.A = res;
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ASL:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = arg << 1;

                    // MSB が立ってる時に左シフトしたら carry になる
                    const carryFlag = (arg & 0x80) === 0x80;
                    const zeroFlag = (res === 0);
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode === AddressingMode.Accumulator) {
                        this.A = res;
                    }
                    else {
                        const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                        this.m_pCpuBus.writeByte(addr, res);
                    }

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.BCC:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    // キャリーフラグが立ってなかったら分岐
                    if (!this.getCarryFlag()) {
                        this.PC = addr;
                        // 分岐成立時に + 1 クロックサイクル
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BCS:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (this.getCarryFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }

                    this.PC += inst.m_Bytes;
                    // 分岐しないときは additionalCyc 足さない
                    return inst.m_Cycles;
                }
            case Opcode.BEQ:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (this.getZeroFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BIT:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const negativeFlag = (arg & 0x80) === 0x80;
                    const overflowFlag = (arg & 0x40) === 0x40;
                    // Set if the result if the AND is zero(？？？？？？？)
                    const zeroFlag = (this.A & arg) === 0;

                    this.setNegativeFlag(negativeFlag);
                    this.setOverflowFlag(overflowFlag);
                    this.SetZeroFlag(zeroFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.BMI:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (this.getNegativeFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    } else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BNE:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (!this.getZeroFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BPL:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (!this.getNegativeFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BRK:
                {
                    this.setBreakFlag(true);
                    this.interrupt(InterruptType.BRK);
                    return inst.m_Cycles;
                }
            case Opcode.BVC:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (!this.getOverflowFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.BVS:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    if (this.getOverflowFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }
                    else {
                        this.PC += inst.m_Bytes;
                        // 分岐しないときは additionalCyc 足さない
                        return inst.m_Cycles;
                    }
                }
            case Opcode.CLC:
                {
                    this.SetCarryFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CLD:
                {
                    this.setDecimalFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CLI:
                {
                    this.setInterruptFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CLV:
                {
                    this.setOverflowFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CMP:
                {
                    const [arg, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    const res = this.A - arg;

                    const carryFlag = this.A >= arg;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.CPX:
                {
                    const [arg, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    const res = this.X - arg;

                    const carryFlag = this.X >= arg;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.CPY:
                {
                    const [arg, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    const res = this.Y - arg;

                    const carryFlag = this.Y >= arg;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.DEC:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, dummy] = this.fetchArg(inst.m_AddressingMode);

                    const res = arg - 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.m_pCpuBus.writeByte(addr, res);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.DEX:
                {
                    // implied のみ
                    const res = this.X - 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.X = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.DEY:
                {
                    // implied のみ
                    const res = this.Y - 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.Y = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.EOR:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = this.A ^ arg;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.INC:
                {
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = arg + 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.m_pCpuBus.writeByte(addr, res);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.INX:
                {
                    // implied のみ
                    const res = this.X + 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.X = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.INY:
                {
                    // implied のみ
                    const res = this.Y + 1;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.Y = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.JMP:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);
                    if (additionalCyc !== 0) throw new Error('CYC non ZERO.');

                    this.PC = addr;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.JSR:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);
                    if (additionalCyc !== 0) throw new Error('CYC non ZERO.');

                    // リターンアドレスは PC + 3 だが、それから 1 を引いたものを stack にプッシュする(そういう仕様)
                    const retAddr = this.PC + 2;

                    // upper.lower の順に push
                    this.pushStack(retAddr >> 8);
                    this.pushStack(retAddr & 0xFF);

                    this.PC = addr;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDA:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const zeroFlag = arg === 0;
                    const negativeFlag = (arg & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.A = arg;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDX:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const zeroFlag = arg === 0;
                    const negativeFlag = (arg & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDY:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const zeroFlag = arg === 0;
                    const negativeFlag = (arg & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.Y = arg;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LSR:
                {
                    let addr = 0;
                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        const [fetchdAddr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                        addr = fetchdAddr;
                    }
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = arg >> 1;

                    const carryFlag = (arg & 1) === 1;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode === AddressingMode.Accumulator) {
                        this.A = res;
                    } else {
                        this.m_pCpuBus.writeByte(addr, res);
                    }

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.NOP:
                {
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ORA:
                {
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = this.A | arg;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) & res;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag !== 0);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.PHA:
                {
                    this.pushStack(this.A);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PHP:
                {
                    // http://wiki.nesdev.com/w/index.php/Status_flags: P の 4bit 目と 5bit 目を立ててスタックにプッシュ
                    this.pushStack(this.P | Constants.B_FLAG_MASK);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PLA:
                {
                    const res = this.popStack();

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PLP:
                {
                    const res = this.popStack();

                    // http://wiki.nesdev.com/w/index.php/Status_flags: Pの 4bit 目と 5bit 目は更新しない
                    this.P = (res & ~Constants.B_FLAG_MASK) | (this.P & Constants.B_FLAG_MASK);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ROL:
                {
                    let addr = 0;
                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        const [fetchdAddr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                        addr = fetchdAddr;
                    }
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    let res = arg << 1;
                    res |= this.getCarryFlag() ? 1 : 0;

                    const carryFlag = (arg & 0x80) === 0x80;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode === AddressingMode.Accumulator) {
                        this.A = res;
                    } else {
                        this.m_pCpuBus.writeByte(addr, res);
                    }

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ROR:
                {
                    let addr = 0;;
                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        const [fetchdAddr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                        addr = fetchdAddr;
                    }
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    let res = arg >> 1;
                    res |= this.getCarryFlag() ? 0x80 : 0;

                    const carryFlag = (arg & 1) === 1;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode === AddressingMode.Accumulator) {
                        this.A = res;
                    }
                    else {
                        this.m_pCpuBus.writeByte(addr, res);
                    }

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.RTI:
                {
                    const res = this.popStack();

                    // http://wiki.nesdev.com/w/index.php/Status_flags: Pの 4bit 目と 5bit 目は更新しない
                    this.P = (res & ~Constants.B_FLAG_MASK) | (this.P & Constants.B_FLAG_MASK);

                    const lower = this.popStack();
                    const upper = this.popStack();
                    this.PC = lower | (upper << 8);

                    return inst.m_Cycles;
                }
            case Opcode.RTS:
                {
                    const lower = this.popStack();
                    const upper = this.popStack();
                    this.PC = lower | (upper << 8);

                    // JSR でスタックにプッシュされるアドレスは JSR の最後のアドレスで、RTS 側でインクリメントされる
                    this.PC++;
                    return inst.m_Cycles;
                }
            case Opcode.SBC:
                {
                    let [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // 足し算に変換
                    // http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html#:~:text=The%20definition%20of%20the%206502,fit%20into%20a%20signed%20byte.&text=For%20each%20set%20of%20input,and%20the%20overflow%20bit%20V.
                    // A - arg - borrow === A + ~arg + carry

                    arg = ~arg;

                    const calc = this.A + arg + (this.getCarryFlag() ? 1 : 0);
                    const res = calc;

                    // 足し算に変換 したので、足し算と同じようにフラグ計算可能
                    const overflowFlag = this.isSignedOverFlowed(this.A, arg, this.getCarryFlag());
                    const carryFlag = calc > 0xff;
                    const negativeFlag = (res & 0x80) === 0x80;
                    const zeroFlag = res === 0;

                    this.setOverflowFlag(overflowFlag);
                    this.SetCarryFlag(carryFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.SetZeroFlag(zeroFlag);

                    this.A = res;
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.SEC:
                {
                    this.SetCarryFlag(true);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.SED:
                {
                    this.setDecimalFlag(true);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.SEI:
                {
                    this.setInterruptFlag(true);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STA:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    this.m_pCpuBus.writeByte(addr, this.A);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STX:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    this.m_pCpuBus.writeByte(addr, this.X);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STY:
                {
                    const [addr, additionalCyc] = this.fetchAddr(inst.m_AddressingMode);

                    this.m_pCpuBus.writeByte(addr, this.Y);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TAX:
                {
                    const zeroFlag = this.A === 0;
                    const negativeFlag = (this.A & 0x80) === 0x80;

                    this.X = this.A;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TAY:
                {
                    const zeroFlag = this.A === 0;
                    const negativeFlag = (this.A & 0x80) === 0x80;

                    this.Y = this.A;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TSX:
                {
                    const res = (this.SP & 0xFF);

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.X = res;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TXA:
                {
                    const zeroFlag = this.X === 0;
                    const negativeFlag = (this.X & 0x80) === 0x80;

                    this.A = this.X;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TXS:
                {
                    // 1 Byte しか使わない
                    this.SP = (this.X);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TYA:
                {
                    const zeroFlag = this.Y === 0;
                    const negativeFlag = (this.Y & 0x80) === 0x80;

                    this.A = this.Y;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ALR:
                {
                    // AND + LSR
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const tmp = this.A & arg;

                    const res = tmp >> 1;

                    const carryFlag = (tmp & 0x01) === 0x01;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ANC:
                {
                    // AND して、 N を C にコピー(符号拡張に使えるそうな)
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const res = this.A & arg;

                    const carryFlag = this.getNegativeFlag();
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ARR:
                {
                    // AND して、 RORする、 C は bit6、 V は bit6 ^ bit5
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const tmp = this.A & arg;
                    const res = tmp >> 1;

                    const carryFlag = (res & 0b01000000) === 0b01000000;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    // carryflag には bit6 が入っているので使う
                    const bit6 = carryFlag;
                    const bit5 = (res & 0b00100000) === 0b00100000;
                    const overflowFlag = bit6 && bit5;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.setOverflowFlag(overflowFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.AXS:
                {
                    // X = this.A & this.X - imm、without borrow であることに注意する(解釈間違ってるかも？)
                    let [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const tmp = this.A & this.X;

                    // 2の補数表現での加算に直す
                    arg = this.getTwosComplement(arg);
                    const calc = tmp + arg;
                    const res = (calc);

                    const carryFlag = calc > 0xFF;
                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.X = res;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LAX:
                {
                    // LDA.TAX(X = A = memory)
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    const zeroFlag = arg === 0;
                    const negativeFlag = (arg & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.X = arg;
                    this.A = arg;

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.SAX:
                {
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);

                    // (memory = this.A & this.X)
                    const res = this.A & this.X;
                    this.m_pCpuBus.writeByte(addr, res);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.DCP:
                {
                    // DEC + CMP

                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // DEC
                    const res = arg - 1;

                    // CMP
                    const resCmp = this.A - res;

                    const zeroFlag = resCmp === 0;
                    const negativeFlag = (resCmp & 0x80) === 0x80;
                    const carryFlag = this.A >= res;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.SetCarryFlag(carryFlag);
                    this.m_pCpuBus.writeByte(addr, res);

                    this.PC += inst.m_Bytes;
                    // DCP は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.ISC:
                {
                    // INC + SBC
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    let [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // INC
                    this.m_pCpuBus.writeByte(addr, ++arg);

                    // 足し算に変換(SBC 同様)
                    // http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html#:~:text=The%20definition%20of%20the%206502,fit%20into%20a%20signed%20byte.&text=For%20each%20set%20of%20input,and%20the%20overflow%20bit%20V.
                    // A - arg - borrow === A + ~arg + carry

                    arg = ~arg;

                    const calc = (this.A) + arg + (this.getCarryFlag() ? 1 : 0);
                    const res = (calc);

                    // 足し算に変換 したので、足し算と同じようにフラグ計算可能
                    const overflowFlag = this.isSignedOverFlowed(this.A, arg, this.getCarryFlag());
                    const carryFlag = calc > 0xff;
                    const negativeFlag = (res & 0x80) === 0x80;
                    const zeroFlag = res === 0;

                    this.setOverflowFlag(overflowFlag);
                    this.SetCarryFlag(carryFlag);
                    this.setNegativeFlag(negativeFlag);
                    this.SetZeroFlag(zeroFlag);

                    this.A = res;
                    this.PC += inst.m_Bytes;
                    // ISC は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.RLA:
                {
                    // ROL + AND

                    // RLA にアドレッシングモード Accumulator はないので、分岐の必要はない
                    if (inst.m_AddressingMode === AddressingMode.Accumulator) throw new Error('Accumulator not found.');
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // ROL
                    let res = arg << 1;
                    res |= this.getCarryFlag() ? 1 : 0;

                    this.m_pCpuBus.writeByte(addr, res);

                    const carryFlag = (arg & 0x80) === 0x80;

                    // AND
                    res &= this.A;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    // RLA は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.RRA:
                {
                    // ROR + ADC
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // ROR
                    let res = arg >> 1;
                    res |= this.getCarryFlag() ? 0x80 : 0;

                    const carryFlag = (arg & 1) === 1;
                    this.SetCarryFlag(carryFlag);
                    this.m_pCpuBus.writeByte(addr, res);

                    // ADC
                    const calc = (this.A) + res + (this.getCarryFlag() ? 1 : 0);
                    const overflowFlag = this.isSignedOverFlowed(this.A, res, this.getCarryFlag());

                    res = (calc);

                    this.SetCarryFlag(calc > 0xff);
                    this.SetZeroFlag(res === 0);
                    this.setNegativeFlag((res & 0x80) === 0x80);
                    // http://forums.nesdev.com/viewtopic.php?t=6331
                    this.setOverflowFlag(overflowFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    // RRA は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SLO:
                {
                    // ASL + ORA
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    // ASL
                    let res = arg << 1;

                    // MSB が立ってる時に左シフトしたら carry になる
                    const carryFlag = (arg & 0x80) === 0x80;
                    this.SetCarryFlag(carryFlag);

                    this.m_pCpuBus.writeByte(addr, res);

                    // ORA
                    res |= this.A;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    // SLO は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SRE:
                {
                    // LSR + EOR
                    const [addr, dummy] = this.fetchAddr(inst.m_AddressingMode);
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    let res = arg >> 1;

                    const carryFlag = (arg & 1) === 1;
                    this.SetCarryFlag(carryFlag);

                    this.m_pCpuBus.writeByte(addr, res);

                    // EOR
                    res ^= this.A;

                    const zeroFlag = res === 0;
                    const negativeFlag = (res & 0x80) === 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.setNegativeFlag(negativeFlag);

                    this.A = res;

                    this.PC += inst.m_Bytes;
                    // SRE は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SKB:
                {
                    // 副作用を気にしたくなった場合のためにフェッチだけする
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.IGN:
                {
                    // 副作用を気にしたくなった場合のためにフェッチだけする
                    const [arg, additionalCyc] = this.fetchArg(inst.m_AddressingMode);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }

            default:
                // unexpected
                // abort();
                throw new Error('unexpected default');
        }
    }


    // CPU の現在の状態を返す
    public getCpuInfoForDebug(): CpuInfo {
        // いまの PC から 命令 取得
        const opcode = this.m_pCpuBus.readByte(this.PC);
        const inst = Instruction.from(opcode);
        const instBytes = new Array(3).fill(0);

        if (inst.m_Bytes > 3) throw new Error('Instruction byte over.');

        for (let i = 0; i < inst.m_Bytes; i++) {
            const byte = this.m_pCpuBus.readByte(i + this.PC);
            instBytes[i] = byte;
        }

        return new CpuInfo(
            this.A,
            this.X,
            this.Y,
            this.PC,
            this.SP,
            this.P,
            inst,
            instBytes,
            instBytes.length
        );
    }

    public interrupt(type: InterruptType): void {
        const m_pCpuBus = this.m_pCpuBus;

        // nested interrupt が許されるのは RESET と NMI のみ
        const nested = this.getInterruptFlag();

        if (nested && (type === InterruptType.BRK || type === InterruptType.IRQ)) return;

        let lower = 0;
        let upper = 0;

        // 割り込みフラグをたてる
        this.setInterruptFlag(true);

        switch (type) {
            case InterruptType.NMI:
                {
                    this.setBreakFlag(false);
                    this.pushStack((this.PC >> 8));
                    this.pushStack(this.PC);

                    // NMI, IRQ のときは 5, 4 bit 目を 10にする
                    let pushData = this.P & 0b11001111;
                    pushData |= (1 << 5);
                    this.pushStack(pushData);

                    lower = m_pCpuBus.readByte(0xFFFA);
                    upper = m_pCpuBus.readByte(0xFFFB);

                    this.PC = lower | (upper << 8);
                    break;
                }
            case InterruptType.RESET:
                {
                    lower = m_pCpuBus.readByte(0xFFFC);
                    upper = m_pCpuBus.readByte(0xFFFD);

                    // https://www.pagetable.com/?p=410
                    this.SP = 0xFD;

                    this.PC = lower | (upper << 8);
                    break;
                }
            case InterruptType.IRQ:
                {
                    this.setBreakFlag(false);
                    this.pushStack((this.PC >> 8));
                    this.pushStack(this.PC);

                    // NMI, IRQ のときは 5, 4 bit 目を 10にする
                    let pushData = this.P & 0b11001111;
                    pushData |= (1 << 5);
                    this.pushStack(pushData);

                    lower = m_pCpuBus.readByte(0xFFFE);
                    upper = m_pCpuBus.readByte(0xFFFF);

                    this.PC = lower | (upper << 8);
                    break;
                }
            case InterruptType.BRK:
                {
                    this.setBreakFlag(true);
                    this.PC++;

                    // PC push
                    this.pushStack((this.PC >> 8));
                    this.pushStack(this.PC);

                    // BRK のときは 5, 4 bit目を 11 にするので雑に OR するだけでいい
                    let pushData = this.P;
                    pushData |= 0b110000;
                    this.pushStack(pushData);

                    lower = m_pCpuBus.readByte(0xFFFE);
                    upper = m_pCpuBus.readByte(0xFFFF);

                    this.PC = lower | (upper << 8);
                    break;
                }
            default:
                break;
        }
    }

    // nestest.nes 用に PC を外部からセットできる関数を公開する
    public setPCForDebug(newPC: number): void {
        this.PC = newPC;
    }

    // ---- private methods ----

    // ステータスフラグをいじる関数
    private setNegativeFlag(flag: boolean): void {
        const bit = 1 << 7;
        if (flag) this.P |= bit;
        else this.P &= ~bit;
    }

    // TODO 代表関数 setFlag() みたいなんを作り、まとめる。

    private setOverflowFlag(flag: boolean): void {
        const bit = 1 << 6;
        if (flag) this.P |= bit;
        else this.P &= ~bit;
    }

    private setBreakFlag(flag: boolean): void {
        if (flag) {
            this.P |= (1 << 4);
        }
        else {
            this.P &= ~(1 << 4);
        }
    }

    private setDecimalFlag(flag: boolean): void {
        if (flag) {
            this.P |= (1 << 3);
        }
        else {
            this.P &= ~(1 << 3);
        }
    }

    private setInterruptFlag(flag: boolean): void {
        if (flag) {
            this.P |= (1 << 2);
        }
        else {
            this.P &= ~(1 << 2);
        }
    }

    private SetZeroFlag(flag: boolean): void {
        if (flag) {
            this.P |= (1 << 1);
        }
        else {
            this.P &= ~(1 << 1);
        }
    }

    private SetCarryFlag(flag: boolean): void {
        if (flag) {
            this.P |= 1;
        }
        else {
            this.P &= ~(1);
        }
    }

    // TODO GetFlagみたいなのを作ってまとめる。

    private getNegativeFlag(): boolean {
        return (this.P & (1 << 7)) === (1 << 7);
    }

    private getOverflowFlag(): boolean {
        return (this.P & (1 << 6)) === (1 << 6);
    }

    private getBreakFlag(): boolean {
        return (this.P & (1 << 4)) === (1 << 4);
    }

    private getDecimalFlag(): boolean {
        return (this.P & (1 << 3)) === (1 << 3);
    }

    private getInterruptFlag(): boolean {
        return (this.P & (1 << 2)) === (1 << 2);
    }

    private getZeroFlag(): boolean {
        return (this.P & (1 << 1)) === (1 << 1);
    }

    private getCarryFlag(): boolean {
        return (this.P & 1) === 1;
    }

    // アドレッシングモードによってオペランドのアドレスをフェッチし、アドレスと追加クロックサイクルを返す
    // 以下は、アドレスを対象にする命令(例: ストア).FetchAddr, 値(参照を剥がして値にするものも含む)を対象にする命令(例: ADC).FetchArg と使い分ける

    // ブランチ条件成立時の追加クロックサイクルは考慮しないことに注意すること
    private fetchAddr(mode: AddressingMode): [number, number] {
        const m_pCpuBus = this.m_pCpuBus;

        // アドレスじゃないはずの人らが来てたらプログラミングミスなので assert しとく
        if ([AddressingMode.Implied, AddressingMode.Immediate, AddressingMode.Accumulator].includes(mode))
            throw new Error('Invalid Addressing Mode.');

        let pOutAddr = 0;
        let pOutAdditionalCyc = 0;

        // PC は命令とオペランドのフェッチでは動かさず、命令実行後にまとめて動かす(デバッグログの実装で有利になる……はず)
        if (mode === AddressingMode.Absolute) {
            let upper = 0;
            let lower = 0;
            lower = m_pCpuBus.readByte(this.PC + 1);
            upper = m_pCpuBus.readByte(this.PC + 2);

            let addr = 0;
            addr |= lower;
            addr |= (upper << 8);

            pOutAddr = addr;
        }
        else if (mode === AddressingMode.ZeroPage) {
            const addr = m_pCpuBus.readByte(this.PC + 1);

            pOutAddr = addr;
        }
        else if (mode === AddressingMode.ZeroPageX) {
            let lower = m_pCpuBus.readByte(this.PC + 1);

            // 上位バイトへの桁上げは無視、なので uint8 のまま加算する
            lower += this.X;
            pOutAddr = lower;
        }
        else if (mode === AddressingMode.ZeroPageY) {
            let lower = m_pCpuBus.readByte(this.PC + 1);

            // 上位バイトへの桁上げは無視、なので uint8 のまま加算する
            lower += this.Y;
            pOutAddr = lower;
        }
        else if (mode === AddressingMode.AbsoluteX) {
            let upper = 0;
            let lower = 0;
            lower = m_pCpuBus.readByte(this.PC + 1);
            upper = m_pCpuBus.readByte(this.PC + 2);

            let addr = 0;
            addr |= lower;
            addr |= (upper << 8);

            let beforeAddr = addr;
            addr += this.X;

            pOutAddr = addr;
            // ページクロスで +1 クロック
            if ((beforeAddr & 0xFF00) != (addr & 0xFF00)) {
                pOutAdditionalCyc = 1;
            }

        }
        else if (mode === AddressingMode.AbsoluteY) {
            let upper = 0;
            let lower = 0;
            lower = m_pCpuBus.readByte(this.PC + 1);
            upper = m_pCpuBus.readByte(this.PC + 2);

            let addr = 0;
            addr |= lower;
            addr |= (upper << 8);

            let beforeAddr = addr;
            addr += this.Y;

            pOutAddr = addr;
            // ページクロスで +1 クロック
            if ((beforeAddr & 0xFF00) != (addr & 0xFF00)) {
                pOutAdditionalCyc = 1;
            }
        }
        else if (mode === AddressingMode.Relative) {
            const offset = m_pCpuBus.readByte(this.PC + 1);
            // 符号拡張 する(若干怪しいので、バグったら疑う(最悪))
            const signedOffset = offset;
            // TORIAEZU: フェッチ済としたときの PC を起点にする
            const signedPC = this.PC + 2;

            const signedAddr = signedPC + signedOffset;
            // const に収まっていることを確認
            if (!(signedAddr >= 0 && signedAddr <= 0xFFFF)) throw new Error('Out range signedAddr.');
            const addr = (signedAddr);

            pOutAddr = addr;
            // ページクロスで +1 クロック、Relative はブランチ命令で使われるが、ブランチ成立時にはさらに +1 されることに注意する
            if ((signedPC & 0xFF00) != (addr & 0xFF00)) {
                pOutAdditionalCyc = 1;
            }
        }
        else if (mode === AddressingMode.IndirectX) {
            // *(lower + X)
            let indirectLower = m_pCpuBus.readByte(this.PC + 1);
            // キャリーは無視 = オーバーフローしても気にしない(符号なし整数のオーバーフローは未定義でないことを確認済み)
            let lowerAddr = indirectLower + this.X;
            const upperAddr = lowerAddr + 1;
            // Indirect なので、FetchAddr 内で1回参照を剥がす
            const lower = m_pCpuBus.readByte(lowerAddr);
            const upper = m_pCpuBus.readByte(upperAddr);

            const addr = lower | (upper << 8);

            pOutAddr = addr;
        }
        else if (mode === AddressingMode.IndirectY) {
            // *(lower) + Y
            // キャリーは無視 = オーバーフローしても気にしない
            let lowerAddr = m_pCpuBus.readByte(this.PC + 1);
            const upperAddr = lowerAddr + 1;
            // Indirect なので、FetchAddr 内で1回参照を剥がす
            const lower = m_pCpuBus.readByte(lowerAddr);
            const upper = m_pCpuBus.readByte(upperAddr);

            let addr = lower | (upper << 8);
            const beforeAddr = addr;

            addr += this.Y;

            pOutAddr = addr;
            // ページクロスで +1 クロック
            if ((beforeAddr & 0xFF00) != (addr & 0xFF00)) {
                pOutAdditionalCyc = 1;
            }
        }
        else if (mode === AddressingMode.Indirect) {
            // **(addr)
            const indirectAddr = 0;

            let indirectLower = m_pCpuBus.readByte(this.PC + 1);
            let indirectUpper = m_pCpuBus.readByte(this.PC + 2);

            // インクリメントにおいて下位バイトからのキャリーを無視するために、下位バイトに加算してからキャストする(ほんまか？？？？？)
            // 符号なし整数の加算のオーバーフロー時の挙動を期待しているので、未定義かも(TODO: 調べる)
            const indirectLower2 = indirectLower + 1;

            // Indirect なので、FetchAddr 内で1回参照を剥がす
            const addrLower = m_pCpuBus.readByte(indirectLower | (indirectUpper << 8));
            const addrUpper = m_pCpuBus.readByte(indirectLower2 | (indirectUpper << 8));

            const addr = addrLower | (addrUpper << 8);
            pOutAddr = addr;
        }
        else {
            // unexpected default
            // abort();
            throw new Error('unexpected default.');
        }

        return [pOutAddr, pOutAdditionalCyc];
    }

    // アドレッシングモードによってオペランドの参照を適切に剥がして値を返す
    private fetchArg(mode: AddressingMode): [number, number] {
        let pOutValue = 0;
        let pOutAdditionalCyc = 0;

        // 引数を持たないアドレッシングモードで呼ばれたらプログラミングミスなので assert しとく
        if (mode === AddressingMode.Implied) throw new Error('Invalid Addressing Mode.');

        if (mode === AddressingMode.Accumulator) {
            pOutValue = this.A;
        }
        else if (mode === AddressingMode.Immediate) {
            // Immediate は PC + 1 から素直に読む
            pOutValue = this.m_pCpuBus.readByte(this.PC + 1);
        }
        else {
            // 他はアドレスがオペランドになってるはずなので、アドレスを持ってきて1回参照を剥がす(Indirect は2回参照を剥がす必要があるが、1回は FetchAddr 側で剥がしている)
            const [addr, cyc] = this.fetchAddr(mode);
            // FIXME この代入を行っているかは怪しい…元ロジックとC++の言語仕様を確認スべし。
            pOutAdditionalCyc = cyc;
            pOutValue = this.m_pCpuBus.readByte(addr);
        }
        return [pOutValue, pOutAdditionalCyc];
    }


    // スタック 操作
    private pushStack(data: number): void {
        this.m_pCpuBus.writeByte(this.SP | (1 << 8), data);
        this.SP--;
    }

    private popStack(): number {
        this.SP++;
        return this.m_pCpuBus.readByte(this.SP | (1 << 8));
    }

    // ---- utility methods ----

    // M, N を 8bit符号付き整数、 C をキャリーフラグとしたとき、N + M + C がオーバーフローするか？
    // 符号付き整数の加減算オーバーフロー判定だが、引数は uint8_tであることに注意する(符号付き整数のオーバーフローは未定義)
    private isSignedOverFlowed(N: number, M: number, C: boolean): boolean {
        const res = N + M + (C ? 1 : 0);
        return ((M ^ res) & (N ^ res) & 0x80) === 0x80;
    }

    // 8bit 符号つき整数における n の 2の補数表現を取得する
    private getTwosComplement(n: number): number {
        return ~n + 1;
    }
}
