import helloWorldRomFile from './sample1.nes';

export class SampleNesFile {
    public readBytes(): number[] {
        return [...Buffer.from(helloWorldRomFile)];
    }
}
