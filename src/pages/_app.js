// src/pages/_app.js

import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/system/services/NotificationRegistry';
import { SettingsProvider } from '@/context/SettingsContext'; // Corrected the path

// We will use one function for our app wrapper
export default function MyApp({ Component, pageProps }) {
  return (
    // All providers are now nested together, wrapping the entire application
    <ThemeProvider>
      <AppProvider>
        <NotificationProvider>
          <SettingsProvider>
            <Component {...pageProps} />
          </SettingsProvider>
        </NotificationProvider>
      </AppProvider>
    </ThemeProvider>
  );
}