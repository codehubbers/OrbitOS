// src/pages/_app.js

import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/system/services/NotificationRegistry';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';

// We will use one function for our app wrapper
export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <SettingsProvider>
              <Component {...pageProps} />
            </SettingsProvider>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}