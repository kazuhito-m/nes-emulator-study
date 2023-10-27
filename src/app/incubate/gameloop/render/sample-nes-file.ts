// import helloWorldRomFile from './sample1.nes';
import specialFile from './test.special';
import testFile from './test.special'
export class SampleNesFile {
    public async readBytes(): Promise<number[]> {
        console.log('specialFileが圧縮されて出力されたり？');
        console.log(specialFile);

        const arrayBuffer = await (await fetch(testFile)).arrayBuffer();
        const simpleArray = [...new Uint8Array(arrayBuffer)];

        console.log('もう、どうしようもないから…Fetchで。');
        console.log('length:' + simpleArray.length)
        for (let i = 0; i < 10; i++) {
            console.log(i + ':' + simpleArray[i]);
        }

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
