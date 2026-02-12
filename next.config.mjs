/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:4001';
    const booksBaseUrl = process.env.NEXT_PUBLIC_BOOKS_BASE_URL || 'http://localhost:4002';

    return [
      {
        source: '/api/auth/:path*',
        destination: `${authBaseUrl}/auth/:path*`,
      },
      {
        source: '/api/books/:path*',
        destination: `${booksBaseUrl}/books/:path*`,
      },
    ];
  },
};

export default nextConfig;
