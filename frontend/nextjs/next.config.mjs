/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const springApiUrl = (
      process.env.SPRING_API_URL ??
      process.env.NEXT_PUBLIC_SPRING_API_URL ??
      'http://localhost:8080'
    ).replace(/\/$/, '')
    return [
      { source: '/spring-auth/:path*', destination: `${springApiUrl}/:path*` },
      { source: '/spring-api/:path*', destination: `${springApiUrl}/api/:path*` },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
