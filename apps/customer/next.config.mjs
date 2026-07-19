/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const nextConfig = {
  transpilePackages: ['@royal-spirits/ui', '@royal-spirits/shared'],
  async rewrites() {
    const isDev = API_URL.startsWith('http://localhost') || API_URL.startsWith('http://127.');
    if (!isDev) {
      return [];
    }
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
