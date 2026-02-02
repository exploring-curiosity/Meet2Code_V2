/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_YJS_URL: process.env.NEXT_PUBLIC_YJS_URL,
    NEXT_PUBLIC_PEER_URL: process.env.NEXT_PUBLIC_PEER_URL
  }
};

export default nextConfig;
