module.exports = function (source, two, three) {
    const filename = 'ここはデタラメでええやろ.json';

    const assetInfo = { sourceFilename: filename }

    // Finally, emit the imported audio file's "source"
    // in the webpack's build directory using a built-in
    // "emitFile" method.
    this.emitFile(filename, source, null, assetInfo)

    console.log('もともと、入ってきたソース:');
    console.log(typeof source);
    console.log(source);
    console.log(two);
    console.log(three);

    return "別に、ふっつーの文字列でも返すことは可能。";
};
