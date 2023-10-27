/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, options) {
        config.module.rules.push({
            test: /\.(nes)$/,
            type: "asset/source",
        });

        return config;
    },
}

module.exports = nextConfig
