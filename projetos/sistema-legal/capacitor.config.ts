import type { CapacitorConfig } from '@capacitor/cli';

const SITE_URL = 'https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/';

const config: CapacitorConfig = {
  appId: 'com.sistemalegal.app',
  appName: 'Sistema Legal',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'mchantre28.github.io',
    url: SITE_URL,
    allowNavigation: [
      'mchantre28.github.io',
      '*.onrender.com',
      '*.googleapis.com',
      '*.firebaseapp.com',
      '*.firebasestorage.app',
    ],
  },
};

export default config;
