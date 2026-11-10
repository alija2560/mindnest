import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mindnest.ir',
  appName: 'nava-app',
  webDir: 'public',
  server: {
    // اینجا آدرس واقعی پروژه خودت روی لیارا را قرار بده (مثال زیر را با آدرس خودت جایگزین کن)
    url: 'https://mindnest.ir/', 
    cleartext: true
  }
};

export default config;