import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.mindnest.app',
  appName: 'آشیانه ذهن',
  webDir: 'out', // پوشه خروجی استاتیک Next.js
  android: {
    allowMixedContent: true,
    backgroundColor: "#06080d"
  }
};

export default config;
  