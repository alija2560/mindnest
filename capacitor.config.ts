import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.mindnest.app',
  appName: 'آشیانه ذهن',
  webDir: 'public',
  server: {
    url: 'https://mindnest.ir/', // اتصال مستقیم و پایدار به سرور اصلی برای بارگذاری کامل صفحه
    cleartext: true,
    allowNavigation: [
      'mindnest.ir',
      '*.mindnest.ir'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#06080d" // همرنگ با تم تاریک اپلیکیشن شما برای جلوگیری از فلش صفحه سیاه
  }
};

export default config;