const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, options) {
        config.module.rules.push({
            test: /\.(nes)$/,
            type: 'asset/resource'
        }, {
            test: /\.(special)$/,
            use: ['c-i-loader'],
        }, {
            test: /\.json$/,
            type: 'json'
        });

        config.resolveLoader.alias['c-i-loader'] =
            path.resolve(__dirname, 'custom/webpack-loader/custom-import-loader.js');

        return config;
    },
}

module.exports = nextConfig
