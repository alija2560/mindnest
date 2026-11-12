import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.mindnest.app',
  appName: 'نوا',
  webDir: 'public', // تنظیم روی پوشه public برای جلوگیری از خطای گم شدن پوشه out
  server: {
    url: 'https://mindnest.ir/', // اتصال مستقیم به سرور برای پشتیبانی از دیتابیس و SSR
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