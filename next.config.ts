/** @type {import('next').Next.jsConfig} */
const nextConfig = {
  typescript: {
    // نادیده گرفتن کامل خطاهای تایپ‌سکریپت در زمان بیلد
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;