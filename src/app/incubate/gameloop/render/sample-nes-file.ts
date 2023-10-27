import helloWorldRomFile from './sample1.nes';

export class SampleNesFile {
    public readBytes(): number[] {
        // TODO 実装。以下はダミー。
        console.log('importしてみた結果。');
        console.log(helloWorldRomFile);
        console.log(typeof helloWorldRomFile);
        console.log('requireしてみた結果。');
        const file = require('./sample1.nes');
        console.log(typeof file);
        console.log(file);
        return [0];
    }
}