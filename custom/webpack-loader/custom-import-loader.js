/**
 * next.jsの"import"でファイルを読み出す際にカスタマイズできるloeder。
 * 
 * next.config.jsのWebPackエントリ(あるいは.babelrc/webpack.config.js)との
 * 組み合わせで、読み取り時に加工したものをimportでとりこめる。
 * 
 * しかし、本当にほしかったのは「ファイルのバイナリ」だが、
 * この機能は「来た時点でStringになってる」ため、意味があまりない。
 * が、これを突き止めるのに多大な労力が掛かったので、サンプルとして残しておく。
 *
 * https://runebook.dev/ja/docs/webpack/configuration/resolve#resolveloader
 * https://devdocs.io/webpack~5/configuration/module#rule
 */
module.exports = function (source, two, three) {
    const filename = 'ここはデタラメでええやろ.json';

    const assetInfo = { sourceFilename: filename }

    // Finally, emit the imported audio file's "source"
    // in the webpack's build directory using a built-in
    // "emitFile" method.
    this.emitFile(filename, source, null, assetInfo)

    console.log('もともと、入ってきたソース:');
    console.log(typeof source);
    console.log('元の文字列での文字数: ' + source.length);
    // console.log(source);
    console.log(two);
    console.log(three);

    const contexts = Buffer.from(source);

    console.log('byteLength:' + contexts.byteLength)
    for (let i = 0; i < 10; i++) {
        console.log(i + ':' + contexts.at(i));
    }

    // return '{ "text": "別に、ふっつーの文字列でも返すことは可能。" }';
    // return '{"key":0, "value": 1}';
    return '{}';
};
