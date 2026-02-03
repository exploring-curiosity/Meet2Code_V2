/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_YJS_URL: process.env.NEXT_PUBLIC_YJS_URL,
    NEXT_PUBLIC_PEER_URL: process.env.NEXT_PUBLIC_PEER_URL
  }
};

export default nextConfig;
