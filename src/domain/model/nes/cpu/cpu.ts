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
                    const [operand, additionalCyc] = this.FetchArg(inst.m_AddressingMode);

                    const calc = this.A + operand + (this.GetCarryFlag() ? 1 : 0);
                    const res = calc;

                    this.SetCarryFlag(calc > 0xff);
                    this.SetZeroFlag(res == 0);
                    this.SetNegativeFlag((res & 0x80) == 0x80);
                    // http://forums.nesdev.com/viewtopic.php?t=6331
                    this.SetOverflowFlag(this.isSignedOverFlowed(this.A, operand, this.GetCarryFlag()));

                    this.A = res;
                    // PC 進める
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.AND:
                {
                    const [arg, additionalCyc] = this.FetchArg(inst.m_AddressingMode);

                    const res = this.A & arg;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    this.A = res;
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ASL:
                {
                    const [arg, additionalCyc] = this.FetchArg(inst.m_AddressingMode);

                    const res = arg << 1;

                    // MSB が立ってる時に左シフトしたら carry になる
                    const carryFlag = (arg & 0x80) == 0x80;
                    const zeroFlag = (res == 0);
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode == AddressingMode.Accumulator) {
                        this.A = res;
                    }
                    else {
                        const [addr, dummy] = this.FetchAddr(inst.m_AddressingMode);
                        this.this.m_pCpuBus.WriteByte(addr, res);
                    }

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.BCC:
                {
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    // キャリーフラグが立ってなかったら分岐
                    if (!this.GetCarryFlag()) {
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
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (this.GetCarryFlag()) {
                        this.PC = addr;
                        return inst.m_Cycles + additionalCyc + 1;
                    }

                    this.PC += inst.m_Bytes;
                    // 分岐しないときは additionalCyc 足さない
                    return inst.m_Cycles;
                }
            case Opcode.BEQ:
                {
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (this.GetZeroFlag()) {
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
                    const [arg, additionalCyc] = this.FetchArg(inst.m_AddressingMode);

                    const negativeFlag = (arg & 0x80) == 0x80;
                    const overflowFlag = (arg & 0x40) == 0x40;
                    // Set if the result if the AND is zero(？？？？？？？)
                    const zeroFlag = (A & arg) == 0;

                    this.SetNegativeFlag(negativeFlag);
                    this.SetOverflowFlag(overflowFlag);
                    this.SetZeroFlag(zeroFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.BMI:
                {
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (this.GetNegativeFlag()) {
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
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (!this.GetZeroFlag()) {
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
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (!this.GetNegativeFlag()) {
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
                    this.SetBreakFlag(true);
                    this.interrupt(InterruptType.BRK);
                    return inst.m_Cycles;
                }
            case Opcode.BVC:
                {
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (!this.GetOverflowFlag()) {
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
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    if (this.GetOverflowFlag()) {
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
                    this.SetDecimalFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CLI:
                {
                    this.SetInterruptFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CLV:
                {
                    this.SetOverflowFlag(false);
                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.CMP:
                {
                    const [arg, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    const res = this.A - arg;

                    const carryFlag = this.A >= arg;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.CPX:
                {
                    const [arg, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    const res = this.X - arg;

                    const carryFlag = this.X >= arg;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.CPY:
                {
                    const [arg, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);

                    const res = this.Y - arg;

                    const carryFlag = this.Y >= arg;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.DEC:
                {
                    const [addr, additionalCyc] = this.FetchAddr(inst.m_AddressingMode);
                    const [arg, dummy] = this.FetchArg(inst.m_AddressingMode);

                    const res = arg - 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    this.m_pCpuBus.writeByte(addr, res);

                    this.PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.DEX:
                {
                    // implied のみ
                    const res = X - 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    X = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.DEY:
                {
                    // implied のみ
                    const res = Y - 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    Y = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.EOR:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = A ^ arg;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.INC:
                {
                    const arg;
                    const additionalCyc;
                    const addr;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = arg + 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    m_pCpuBus.WriteByte(addr, res);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.INX:
                {
                    // implied のみ
                    const res = X + 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    X = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.INY:
                {
                    // implied のみ
                    const res = Y + 1;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    Y = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.JMP:
                {
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    assert(additionalCyc == 0);

                    PC = addr;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.JSR:
                {
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    assert(additionalCyc == 0);

                    // リターンアドレスは PC + 3 だが、それから 1 を引いたものを stack にプッシュする(そういう仕様)
                    const retAddr = PC + 2;

                    // upper.lower の順に push
                    PushStack(static_cast <const> (retAddr >> 8));
                    PushStack(static_cast <const> (retAddr & 0xFF));

                    PC = addr;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDA:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const zeroFlag = arg == 0;
                    const negativeFlag = (arg & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    A = arg;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDX:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const zeroFlag = arg == 0;
                    const negativeFlag = (arg & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    X = arg;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LDY:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const zeroFlag = arg == 0;
                    const negativeFlag = (arg & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    Y = arg;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LSR:
                {
                    const arg;
                    const additionalCyc;
                    const addr = 0;;

                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    }
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = arg >> 1;

                    const carryFlag = (arg & 1) == 1;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode == AddressingMode.Accumulator) {
                        A = res;
                    }
                    else {
                        m_pCpuBus.WriteByte(addr, res);
                    }

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.NOP:
                {
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ORA:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = A | arg;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) & res;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.PHA:
                {
                    PushStack(A);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PHP:
                {
                    // http://wiki.nesdev.com/w/index.php/Status_flags: P の 4bit 目と 5bit 目を立ててスタックにプッシュ
                    PushStack(P | B_FLAG_MASK);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PLA:
                {
                    const res = PopStack();

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.PLP:
                {
                    const res = PopStack();

                    // http://wiki.nesdev.com/w/index.php/Status_flags: Pの 4bit 目と 5bit 目は更新しない
                    P = (res & ~B_FLAG_MASK) | (P & B_FLAG_MASK);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ROL:
                {
                    const arg;
                    const additionalCyc;
                    const addr = 0;

                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    }
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = arg << 1;
                    res |= GetCarryFlag() ? 1 : 0;

                    const carryFlag = (arg & 0x80) == 0x80;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode == AddressingMode.Accumulator) {
                        A = res;
                    }
                    else {
                        m_pCpuBus.WriteByte(addr, res);
                    }

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ROR:
                {
                    const arg;
                    const additionalCyc;
                    const addr = 0;;

                    if (inst.m_AddressingMode != AddressingMode.Accumulator) {
                        FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    }
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = arg >> 1;
                    res |= GetCarryFlag() ? 0x80 : 0;

                    const carryFlag = (arg & 1) == 1;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    if (inst.m_AddressingMode == AddressingMode.Accumulator) {
                        A = res;
                    }
                    else {
                        m_pCpuBus.WriteByte(addr, res);
                    }

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.RTI:
                {
                    const res = PopStack();

                    // http://wiki.nesdev.com/w/index.php/Status_flags: Pの 4bit 目と 5bit 目は更新しない
                    P = (res & ~B_FLAG_MASK) | (P & B_FLAG_MASK);

                    const lower = PopStack();
                    const upper = PopStack();
                    PC = lower | (upper << 8);

                    return inst.m_Cycles;
                }
            case Opcode.RTS:
                {
                    const lower = PopStack();
                    const upper = PopStack();
                    PC = lower | (upper << 8);

                    // JSR でスタックにプッシュされるアドレスは JSR の最後のアドレスで、RTS 側でインクリメントされる
                    PC++;
                    return inst.m_Cycles;
                }
            case Opcode.SBC:
                {
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // 足し算に変換
                    // http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html#:~:text=The%20definition%20of%20the%206502,fit%20into%20a%20signed%20byte.&text=For%20each%20set%20of%20input,and%20the%20overflow%20bit%20V.
                    // A - arg - borrow == A + ~arg + carry

                    arg = ~arg;

                    const calc = static_cast<int16_t>(A) + arg + GetCarryFlag();
                    const res = static_cast <const> (calc);

                    // 足し算に変換 したので、足し算と同じようにフラグ計算可能
                    const overflowFlag = isSignedOverFlowed(A, arg, GetCarryFlag());
                    const carryFlag = calc > 0xff;
                    const negativeFlag = (res & 0x80) == 0x80;
                    const zeroFlag = res == 0;

                    SetOverflowFlag(overflowFlag);
                    this.SetCarryFlag(carryFlag);
                    this.SetNegativeFlag(negativeFlag);
                    this.SetZeroFlag(zeroFlag);

                    A = res;
                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.SEC:
                {
                    this.SetCarryFlag(true);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.SED:
                {
                    SetDecimalFlag(true);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.SEI:
                {
                    SetInterruptFlag(true);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STA:
                {
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);

                    m_pCpuBus.WriteByte(addr, A);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STX:
                {
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);

                    m_pCpuBus.WriteByte(addr, X);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.STY:
                {
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);

                    m_pCpuBus.WriteByte(addr, Y);
                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TAX:
                {
                    const zeroFlag = A == 0;
                    const negativeFlag = (A & 0x80) == 0x80;

                    X = A;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TAY:
                {
                    const zeroFlag = A == 0;
                    const negativeFlag = (A & 0x80) == 0x80;

                    Y = A;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TSX:
                {
                    const res = static_cast <const> (SP & 0xFF);

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    X = res;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TXA:
                {
                    const zeroFlag = X == 0;
                    const negativeFlag = (X & 0x80) == 0x80;

                    A = X;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TXS:
                {
                    // 1 Byte しか使わない
                    SP = static_cast <const> (X);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.TYA:
                {
                    const zeroFlag = Y == 0;
                    const negativeFlag = (Y & 0x80) == 0x80;

                    A = Y;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.ALR:
                {
                    // AND + LSR
                    const arg;
                    const additionalCyc;

                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const tmp = A & arg;

                    const res = tmp >> 1;

                    const carryFlag = (tmp & 0x01) == 0x01;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ANC:
                {
                    // AND して、 N を C にコピー(符号拡張に使えるそうな)
                    const arg;
                    const additionalCyc;

                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = A & arg;

                    const carryFlag = GetNegativeFlag();
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.ARR:
                {
                    // AND して、 RORする、 C は bit6、 V は bit6 ^ bit5
                    const arg;
                    const additionalCyc;

                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const tmp = A & arg;
                    const res = tmp >> 1;

                    const carryFlag = (res & 0b01000000) == 0b01000000;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    // carryflag には bit6 が入っているので使う
                    const bit6 = carryFlag;
                    const bit5 = (res & 0b00100000) == 0b00100000;
                    const overflowFlag = bit6 ^ bit5;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    SetOverflowFlag(overflowFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.AXS:
                {
                    // X = A & X - imm、without borrow であることに注意する(解釈間違ってるかも？)
                    const arg;
                    const additionalCyc;

                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const tmp = A & X;

                    // 2の補数表現での加算に直す
                    arg = GetTwosComplement(arg);
                    const calc = tmp + arg;
                    const res = static_cast <const> (calc);

                    const carryFlag = calc > 0xFF;
                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    X = res;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.LAX:
                {
                    // LDA.TAX(X = A = memory)
                    const arg;
                    const additionalCyc;

                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const zeroFlag = arg == 0;
                    const negativeFlag = (arg & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    X = arg;
                    A = arg;

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }
            case Opcode.SAX:
                {
                    const addr = 0;
                    const dummy = 0;
                    FetchAddr(inst.m_AddressingMode, & addr, & dummy);

                    // (memory = A & X)
                    const res = A & X;
                    m_pCpuBus.WriteByte(addr, res);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.DCP:
                {
                    // DEC + CMP

                    const arg;
                    const additionalCyc;
                    const addr;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // DEC
                    const res = arg - 1;

                    // CMP
                    const resCmp = A - res;

                    const zeroFlag = resCmp == 0;
                    const negativeFlag = (resCmp & 0x80) == 0x80;
                    const carryFlag = A >= res;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);
                    this.SetCarryFlag(carryFlag);
                    m_pCpuBus.WriteByte(addr, res);

                    PC += inst.m_Bytes;
                    // DCP は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.ISC:
                {
                    // INC + SBC

                    const arg;
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // INC
                    m_pCpuBus.WriteByte(addr, ++arg);

                    // 足し算に変換(SBC 同様)
                    // http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html#:~:text=The%20definition%20of%20the%206502,fit%20into%20a%20signed%20byte.&text=For%20each%20set%20of%20input,and%20the%20overflow%20bit%20V.
                    // A - arg - borrow == A + ~arg + carry

                    arg = ~arg;

                    const calc = static_cast<int16_t>(A) + arg + GetCarryFlag();
                    const res = static_cast <const> (calc);

                    // 足し算に変換 したので、足し算と同じようにフラグ計算可能
                    const overflowFlag = isSignedOverFlowed(A, arg, GetCarryFlag());
                    const carryFlag = calc > 0xff;
                    const negativeFlag = (res & 0x80) == 0x80;
                    const zeroFlag = res == 0;

                    SetOverflowFlag(overflowFlag);
                    this.SetCarryFlag(carryFlag);
                    this.SetNegativeFlag(negativeFlag);
                    this.SetZeroFlag(zeroFlag);

                    A = res;
                    PC += inst.m_Bytes;
                    // ISC は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.RLA:
                {
                    // ROL + AND
                    const arg;
                    const additionalCyc;
                    const addr = 0;

                    // RLA にアドレッシングモード Accumulator はないので、分岐の必要はない
                    assert(inst.m_AddressingMode != AddressingMode.Accumulator);
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // ROL
                    const res = arg << 1;
                    res |= GetCarryFlag() ? 1 : 0;

                    m_pCpuBus.WriteByte(addr, res);

                    const carryFlag = (arg & 0x80) == 0x80;

                    // AND
                    res &= A;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetCarryFlag(carryFlag);
                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    // RLA は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.RRA:
                {
                    // ROR + ADC
                    const arg;
                    const additionalCyc;
                    const addr = 0;

                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // ROR
                    const res = arg >> 1;
                    res |= GetCarryFlag() ? 0x80 : 0;

                    const carryFlag = (arg & 1) == 1;
                    this.SetCarryFlag(carryFlag);
                    m_pCpuBus.WriteByte(addr, res);

                    // ADC
                    const calc = static_cast <const> (A) + res + GetCarryFlag();
                    const overflowFlag = isSignedOverFlowed(A, res, GetCarryFlag());

                    res = static_cast <const> (calc);

                    this.SetCarryFlag(calc > 0xff);
                    this.SetZeroFlag(res == 0);
                    this.SetNegativeFlag((res & 0x80) == 0x80);
                    // http://forums.nesdev.com/viewtopic.php?t=6331
                    SetOverflowFlag(overflowFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    // RRA は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SLO:
                {
                    // ASL + ORA

                    const arg;
                    const addr;
                    const additionalCyc;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    // ASL
                    const res = arg << 1;

                    // MSB が立ってる時に左シフトしたら carry になる
                    const carryFlag = (arg & 0x80) == 0x80;
                    this.SetCarryFlag(carryFlag);

                    m_pCpuBus.WriteByte(addr, res);

                    // ORA
                    res |= A;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    // SLO は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SRE:
                {
                    // LSR + EOR
                    const arg;
                    const additionalCyc;
                    const addr = 0;
                    FetchAddr(inst.m_AddressingMode, & addr, & additionalCyc);
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    const res = arg >> 1;

                    const carryFlag = (arg & 1) == 1;
                    this.SetCarryFlag(carryFlag);

                    m_pCpuBus.WriteByte(addr, res);

                    // EOR
                    res ^= A;

                    const zeroFlag = res == 0;
                    const negativeFlag = (res & 0x80) == 0x80;

                    this.SetZeroFlag(zeroFlag);
                    this.SetNegativeFlag(negativeFlag);

                    A = res;

                    PC += inst.m_Bytes;
                    // SRE は additionalCyc を足さない(多分……)
                    return inst.m_Cycles;
                }
            case Opcode.SKB:
                {
                    // 副作用を気にしたくなった場合のためにフェッチだけする
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles;
                }
            case Opcode.IGN:
                {
                    // 副作用を気にしたくなった場合のためにフェッチだけする
                    const arg;
                    const additionalCyc;
                    FetchArg(inst.m_AddressingMode, & arg, & additionalCyc);

                    PC += inst.m_Bytes;
                    return inst.m_Cycles + additionalCyc;
                }

            default:
                // unexpected default
                abort();
                break;
        }
        return 0;
    }


    // CPU の現在の状態を返す
    public getCpuInfoForDebug(): CpuInfo {

    }

    public interrupt(type: InterruptType): void {

    }

    // nestest.nes 用に PC を外部からセットできる関数を公開する
    public setPCForDebug(newPC: number): void {

    }

    // ---- private methods ----

    // ステータスフラグをいじる関数
    private SetNegativeFlag(flag: boolean): void {
        // TODO 実装。
    }

    private SetOverflowFlag(flag: boolean): void {
        // TODO 実装。
    }

    private SetBreakFlag(flag: boolean): void {
        // TODO 実装。
    }

    private SetDecimalFlag(flag: boolean): void {
        // TODO 実装。
    }

    private SetInterruptFlag(flag: boolean): void {
        // TODO 実装。
    }

    private this.SetZeroFlag(flag: boolean): void {
        // TODO 実装。
    }

    private SetCarryFlag(flag: boolean): void {
        // TODO 実装。
    }


    private GetNegativeFlag(): boolean {
        // TODO 実装。
    }

    private GetOverflowFlag(): boolean {
        // TODO 実装。
    }

    private GetBreakFlag(): boolean {
        // TODO 実装。
    }

    private GetDecimalFlag(): boolean {
        // TODO 実装。
    }

    private GetInterruptFlag(): boolean {
        // TODO 実装。
    }

    private GetZeroFlag(): boolean {
        // TODO 実装。
    }

    private GetCarryFlag(): boolean {
        // TODO 実装。
    }


    // アドレッシングモードによってオペランドのアドレスをフェッチし、アドレスと追加クロックサイクルを返す
    // 以下は、アドレスを対象にする命令(例: ストア).FetchAddr, 値(参照を剥がして値にするものも含む)を対象にする命令(例: ADC).FetchArg と使い分ける

    // ブランチ条件成立時の追加クロックサイクルは考慮しないことに注意すること
    private FetchAddr(mode: AddressingMode): [number, number] {
        // TODO 実装。

        // TODO const* pOutAddr, const* pOutAdditionalCyc 返す
    }

    // アドレッシングモードによってオペランドの参照を適切に剥がして値を返す
    private FetchArg(mode: AddressingMode): [number, number] {
        // TODO 実装。

        // TODO const* pOutAddr, const* pOutAdditionalCyc 返す
    }


    // スタック 操作
    private PushStack(data: number): void {
        // TODO 実装。
    }

    private PopStack(): number {
        // TODO 実装。
    }

    // ---- utility methods ----

    // M, N を 8bit符号付き整数、 C をキャリーフラグとしたとき、N + M + C がオーバーフローするか？
    // 符号付き整数の加減算オーバーフロー判定だが、引数は uint8_tであることに注意する(符号付き整数のオーバーフローは未定義)
    private isSignedOverFlowed(N: number, M: number, C: boolean): boolean {
        const res = N + M + C;
        return ((M ^ res) & (N ^ res) & 0x80) == 0x80;
    }

    // 8bit 符号つき整数における n の 2の補数表現を取得する
    private GetTwosComplement(n: number): number {
        return ~n + 1;
    }
}
