import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { isFrameBlocked, normalizeUrl } from '@/lib/browserUrl';

// Sites that allow being shown inside OrbitOS.
const QUICK_LINKS = [
  { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
  {
    label: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/export/embed.html',
  },
  { label: 'Internet Archive', url: 'https://archive.org/' },
  { label: 'example.com', url: 'https://example.com/' },
];

export default function BrowserApp() {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState(null);
  const [error, setError] = useState('');

  const go = (value) => {
    const href = normalizeUrl(value);
    if (!href) {
      setError('Only http:// and https:// addresses can be opened.');
      return;
    }
    setError('');
    setInput(href);
    setCurrentUrl(href);
  };

  const goHome = () => {
    setError('');
    setInput('');
    setCurrentUrl(null);
  };

  const blocked = currentUrl && isFrameBlocked(currentUrl);
  const host = currentUrl ? new URL(currentUrl).hostname : '';

  return (
    <div className={`h-full flex flex-col ${theme.app.bg} ${theme.app.text}`}>
      <form
        className={`flex items-center gap-2 p-2 border-b ${theme.window.header}`}
        onSubmit={(e) => {
          e.preventDefault();
          go(input);
        }}
      >
        <button
          type="button"
          onClick={goHome}
          className={`px-3 py-1 rounded ${theme.app.button}`}
          aria-label="Home"
        >
          Home
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`flex-1 px-3 py-1 border rounded ${theme.app.input}`}
          placeholder="Type a URL or search Wikipedia"
          aria-label="Address"
        />
        <button
          type="submit"
          className={`px-3 py-1 rounded ${theme.app.button}`}
        >
          Go
        </button>
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1 rounded ${theme.app.button}`}
          >
            Open in new tab
          </a>
        )}
      </form>

      {error && (
        <p role="alert" className="px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex-1 min-h-0">
        {!currentUrl && (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
            <h2 className="text-xl font-semibold">Start page</h2>
            <p className={`max-w-md text-sm ${theme.app.text_subtle}`}>
              Pages open inside OrbitOS. Some sites, like Google, GitHub and
              YouTube, don&apos;t allow that. For those you&apos;ll get a button
              to open them in a new tab.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_LINKS.map((l) => (
                <button
                  key={l.url}
                  type="button"
                  onClick={() => go(l.url)}
                  className={`px-3 py-1 rounded ${theme.app.button}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {blocked && (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <h2 className="text-lg font-semibold">
              {host} can&apos;t be shown here
            </h2>
            <p className={`max-w-md text-sm ${theme.app.text_subtle}`}>
              This site tells browsers not to display it inside other websites.
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded ${theme.app.button}`}
            >
              Open {host} in a new tab
            </a>
          </div>
        )}

        {currentUrl && !blocked && (
          <iframe
            key={currentUrl}
            src={currentUrl}
            className="w-full h-full border-none"
            title="Browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
}
