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
    url: SITE_URL + '?acesso=opcoes',
    allowNavigation: [
      'mchantre28.github.io',
      '*.onrender.com',
      '*.googleapis.com',
      '*.google.com',
      '*.gstatic.com',
      '*.firebaseapp.com',
      '*.firebasestorage.app',
      'firestore.googleapis.com',
      'identitytoolkit.googleapis.com',
      'securetoken.googleapis.com',
      'firebaseinstallations.googleapis.com',
      'cdn.jsdelivr.net',
      'cdnjs.cloudflare.com',
      'unpkg.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
