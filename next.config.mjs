/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/fitness',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
