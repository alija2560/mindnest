/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // نادیده گرفتن کامل خطاهای تایپ‌سکریپت در زمان بیلد
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/auth",
        permanent: false, // ریدایرکت از / به /auth
      },
    ];
  },
  async headers() {
    return [
      {
        // اعمال این هدرها روی تمام مسیرهای برنامه
        source: "/:path*",
        headers: [
          // ۱. جلوگیری از قرار گرفتن سایت در داخل Iframe دیگران (جلوگیری از Clickjacking)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // ۲. جلوگیری از حدس زدن نوع محتوا توسط مرورگر (MIME-sniffing)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // ۳. اجبار به استفاده از ارتباط امن
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // ۴. کنترل دسترسی به اطلاعات ارجاع‌دهنده
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // ۵. مسدودسازی دسترسی‌های سخت‌افزاری غیرمجاز
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;