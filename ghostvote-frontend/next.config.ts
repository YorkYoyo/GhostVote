import type { NextConfig } from "next";

function normalizeBasePath(value?: string): string {
  if (!value) return "";
  if (value === "/") return "";
  return value.startsWith("/") ? value : `/${value}`;
}

const basePath = normalizeBasePath(process.env.NEXT_BASE_PATH);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

