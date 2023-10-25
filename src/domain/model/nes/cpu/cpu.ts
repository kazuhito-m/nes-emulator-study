import { CpuBus } from "./cpu-bus";
import { CpuInfo } from "./cpu-info";

export enum Opcode {
    ADC,
    AND,
    ASL,
    BCC,
    BCS,
    BEQ,
    BIT,
    BMI,
    BNE,
    BPL,
    BRK,
    BVC,
    BVS,
    CLC,
    CLD,
    CLI,
    CLV,
    CMP,
    CPX,
    CPY,
    DEC,
    DEX,
    DEY,
    EOR,
    INC,
    INX,
    INY,
    JMP,
    JSR,
    LDA,
    LDX,
    LDY,
    LSR,
    NOP,
    ORA,
    PHA,
    PHP,
    PLA,
    PLP,
    ROL,
    ROR,
    RTI,
    RTS,
    SBC,
    SEC,
    SED,
    SEI,
    STA,
    STX,
    STY,
    TAX,
    TAY,
    TSX,
    TXA,
    TXS,
    TYA,
    // unofficial
    // https://wiki.nesdev.com/w/index.php/Programming_with_unofficial_opcodes
    ALR,
    ANC,
    ARR,
    AXS,
    LAX,
    SAX,
    DCP,
    ISC,
    RLA,
    RRA,
    SLO,
    SRE,
    SKB,
    IGN,
    // unofficial かつ既存の Opcode は既存の Opcode を使うものとします
};

export enum AddressingMode {
    Implied,
    Accumulator,
    Immediate,
    Absolute,
    ZeroPage,
    ZeroPageX,
    ZeroPageY,
    AbsoluteX,
    AbsoluteY,
    Relative,
    Indirect,
    IndirectX,
    IndirectY,
};

export enum InterruptType {
    NMI,
    RESET,
    IRQ,
    BRK,
};

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

    private SetZeroFlag(flag: boolean): void {
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
    // 以下は、アドレスを対象にする命令(例: ストア) -> FetchAddr, 値(参照を剥がして値にするものも含む)を対象にする命令(例: ADC) -> FetchArg と使い分ける

    // ブランチ条件成立時の追加クロックサイクルは考慮しないことに注意すること
    private FetchAddr(mode: AddressingMode): [number, number] {
        // TODO 実装。

        // TODO uint16_t* pOutAddr, uint8_t* pOutAdditionalCyc 返す
    }

    // アドレッシングモードによってオペランドの参照を適切に剥がして値を返す
    private FetchArg(mode: AddressingMode): [number, number] {
        // TODO 実装。

        // TODO uint16_t* pOutAddr, uint8_t* pOutAdditionalCyc 返す
    }


    // スタック 操作
    private PushStack(data: number): void {
        // TODO 実装。
    }

    private PopStack(): number {
        // TODO 実装。
    }
}