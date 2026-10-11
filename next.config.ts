/** @type {import('next').Next.js Configuration} */
const nextConfig = {
  typescript: {
    // !! هشدار: این کار باعث می‌شود خطاهای تایپ‌سکریپت مانع بیلد نشوند
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;