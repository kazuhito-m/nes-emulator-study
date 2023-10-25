import { Instruction } from "./instruction";

/**
 * デバッグ用 CPU情報出力構造体。
 * 命令長は Instruction が保持することに気を付ける。
 */
export class CpuInfo {
    // レジスタ名は命名規則に従わない
    private A: number;
    private X: number;
    private Y: number;
    private PC: number;
    private SP: number;
    // 下から順番に、 CZIDB1VN
    private P: number;

    private m_Instruction: Instruction;
    private m_InstructionBytes: number[] = new Array(3).fill(0);

    constructor(a: number, x: number, y: number, pc: number, sp: number, p: number, inst: Instruction, pBytes: number[], bufferSize: number) {
        this.A = a;
        this.X = x;
        this.Y = y;
        this.PC = pc;
        this.SP = sp;
        this.P = p;
        this.m_Instruction = inst;

        if (bufferSize < inst.m_Bytes) throw new Error('Unmatch byte size.');

        for (let i = 0; i < inst.m_Bytes; i++)
            this.m_InstructionBytes[i] = pBytes[i];
    }
}
