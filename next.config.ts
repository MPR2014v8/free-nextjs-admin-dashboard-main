/* eslint-disable @typescript-eslint/no-explicit-any */
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   webpack(config) {
//     config.module.rules.push({
//       test: /\.svg$/,
//       use: ["@svgr/webpack"],
//     });
//     return config;
//   },
// };

// export default nextConfig;

// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  outputFileTracingRoot: __dirname,

  webpack(config) {
    const assetRule = config.module.rules.find(
      (rule: any) =>
        rule &&
        typeof rule === "object" &&
        rule.test instanceof RegExp &&
        rule.test.test?.(".svg"),
    );
    if (assetRule) {
      (assetRule as any).exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
            svgo: true,
            svgoConfig: {
              plugins: [
                "preset-default",
                { name: "removeViewBox", active: false },
              ],
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
