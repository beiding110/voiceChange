module.exports = {
    entry: './index.js',
    output: {
        filename: './voiceChanger.js',
        // export to AMD, CommonJS, or window
        libraryTarget: 'umd',
        // the name exported to window
        library: 'voiceChanger',
    },
    devtool: 'source-map',
};
