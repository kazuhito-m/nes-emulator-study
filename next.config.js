const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, options) {
        config.module.rules.push({
            // test: /\.(nes)$/,
            //     type: "asset/inline",
            // }, {
            //     test: /\.(special)$/,
            //     use: ['m-c-loader'],
        }, {
            test: /\.(special)$/,
            type: 'asset/resource'
        }, {
            test: /\.json$/,
            type: 'json'
        });

        config.resolveLoader.alias['m-c-loader'] = path.resolve(__dirname, 'MyCustomLoader.js');

        return config;
    },
}

module.exports = nextConfig
