// import helloWorldRomFile from './sample1.nes';
import specialFile from './test.special';

export class SampleNesFile {
    public readBytes(): number[] {
        console.log('specialFileが圧縮されて出力されたり？');
        console.log(specialFile);

        // console.log('base64文字列？');
        // console.log(helloWorldRomFile);

        // const contexts = Buffer.from(helloWorldRomFile);

        // console.log('byteLength:' + contexts.byteLength)
        // for (let i = 0; i < 10; i++) {
        //     console.log(i + ':' + contexts.at(i));
        // }

        // return [...Buffer.from(helloWorldRomFile)];
        return [0];
    }
}
