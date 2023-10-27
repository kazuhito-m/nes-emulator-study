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
        expect(testFileContents.byteLength).toBe(40976);
        [78, 69, 83, 26, 2, 1, 1, 0, 0, 0].forEach((exp, i) =>
            expect(testFileContents.at(i)).toBe(exp));

        // FIXME 結局、下はGUIがある時でないとテストできない。いつか動かせるように。

        // const sut = new SampleNesFile();

        // const actualBytes = sut.readBytes();

        // expect(actualBytes.length).toBe(testFileContents.byteLength);
    });
});