import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.mindnest.app',
  appName: 'نوا',
  webDir: 'public', // پوشه عمومی پیش‌فرض برای جلوگیری از خطای out
  server: {
    url: 'https://mindnest.ir/', // اتصال به سرور اصلی برای پشتیبانی از SSR و کوکی‌ها
    cleartext: true,
    allowNavigation: [
      'mindnest.ir',
      '*.mindnest.ir'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#06080d"
  }
};

export default config;