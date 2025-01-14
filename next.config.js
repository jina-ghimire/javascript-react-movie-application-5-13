/* eslint-disable @typescript-eslint/no-var-requires */
const withTM = require('next-transpile-modules')([
  'antd',
  '@ant-design/icons',
  '@ant-design/icons-svg',
  'rc-pagination',
  'rc-util',
  'rc-picker',
  'rc-input',
]);

module.exports = withTM({
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },
});
