import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.celiopromo.app',
  appName: 'Celio',
  webDir: 'dist/public',
  server: {
    // Bundled mode: the WebView loads dist/public from inside the APK over
    // the https://localhost scheme. API calls go to celiopromo.it via the
    // fetch interceptor in client/src/lib/apiBase.ts (prefixes /api/*
    // automatically when running natively). This is the App-Store-ready
    // shape — bundle ships once, data lives at celiopromo.it.
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
