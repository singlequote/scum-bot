const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        app : './resources/js/app.js',
        dashboard : './resources/js/dashboard.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        chunkFilename: '[id].js'
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ],
    },
};