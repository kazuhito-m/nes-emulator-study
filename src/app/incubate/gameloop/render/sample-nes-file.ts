import helloWorldRomFileUri from './sample1.nes';
export class SampleNesFile {
    public async readBytes(): Promise<number[]> {
        const buffer = await (await fetch(helloWorldRomFileUri)).arrayBuffer();
        return [...new Uint8Array(buffer)];
    }
}
