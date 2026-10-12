/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // نادیده گرفتن کامل خطاهای تایپ‌سکریپت در زمان بیلد
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;