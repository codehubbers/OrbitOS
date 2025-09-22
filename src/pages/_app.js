import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/system/services/NotificationRegistry';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AppProvider>
        <NotificationProvider>
          <Component {...pageProps} />
        </NotificationProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
