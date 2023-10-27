import helloWorldRomFile from './sample1.nes';

export class SampleNesFile {
    public readBytes(): number[] {
        // TODO 実装。以下はダミー。
        console.log('importしてみた結果。');
        console.log(helloWorldRomFile);
        console.log(typeof helloWorldRomFile);
        return [0];
    }
}