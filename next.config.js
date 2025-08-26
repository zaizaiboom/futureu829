/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 禁用自动预取以避免 ERR_ABORTED 错误
    optimisticClientCache: false,
  },
  // 禁用默认的链接预取
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig