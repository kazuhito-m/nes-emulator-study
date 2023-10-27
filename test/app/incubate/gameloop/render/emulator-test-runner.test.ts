import { EmulatorTestRunner } from "@/app/incubate/gameloop/render/emulator-test-runner";
import { SampleNesFile } from "@/app/incubate/gameloop/render/sample-nes-file";
import fs from "fs";
import path from "path";

const loadTestFile = (fileName: string): Buffer => {
    const testFilePath = path.join(__dirname, fileName);
    return fs.readFileSync(testFilePath);
}

describe("emulator-test-runner.test.ts の単体テスト", () => {
    it("importで読んだファイルが、FileReader等で読んだバイト配列と一致するか", () => {
        const testFileContents = loadTestFile("sample1.nes");
        // テスト側の「ファイル読み込みがうまくいってるか」の確認。
        expect(testFileContents.byteLength).toBe(409767);
        [78, 69, 83, 26].forEach((exp, i) =>
            expect(testFileContents.at(i)).toBe(exp));

        const sut = new SampleNesFile();

        const actualBytes = sut.readBytes();

        expect(actualBytes.length).toBe(testFileContents.byteLength);
    });
});