import { fireEvent, render, screen } from '@testing-library/react';
import BrowserApp from '@/pages/apps/browser';
import { isFrameBlocked, normalizeUrl } from '@/lib/browserUrl';

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      app: { bg: '', text: '', input: '', button: '', text_subtle: '' },
      window: { header: '' },
    },
  }),
}));

describe('normalizeUrl', () => {
  it('adds https to bare hosts', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    expect(normalizeUrl('  en.wikipedia.org/wiki/Mars ')).toBe(
      'https://en.wikipedia.org/wiki/Mars',
    );
    expect(normalizeUrl('localhost:3000')).toBe('https://localhost:3000/');
  });

  it('keeps http and https URLs', () => {
    expect(normalizeUrl('http://example.com/a?b=1')).toBe(
      'http://example.com/a?b=1',
    );
  });

  it('turns plain words into a Wikipedia search', () => {
    expect(normalizeUrl('open source')).toBe(
      'https://en.wikipedia.org/w/index.php?search=open%20source',
    );
  });

  it('rejects dangerous schemes', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(normalizeUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});

describe('isFrameBlocked', () => {
  it('matches known hosts and their subdomains', () => {
    expect(isFrameBlocked('https://www.google.com/')).toBe(true);
    expect(isFrameBlocked('https://github.com/codehubbers')).toBe(true);
    expect(isFrameBlocked('https://example.com/')).toBe(false);
    expect(isFrameBlocked('https://notgoogle.com/')).toBe(false);
  });
});

describe('BrowserApp', () => {
  const type = (value) => {
    fireEvent.change(screen.getByLabelText('Address'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
  };

  it('starts on the start page without loading a frame', () => {
    const { container } = render(<BrowserApp />);
    expect(screen.getByText('Start page')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('loads frame-friendly sites in a sandboxed iframe', () => {
    const { container } = render(<BrowserApp />);
    type('example.com');
    const frame = container.querySelector('iframe');
    expect(frame).toHaveAttribute('src', 'https://example.com/');
    expect(frame).toHaveAttribute('sandbox');
    expect(
      screen.getByRole('link', { name: 'Open in new tab' }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows an open-in-new-tab card for sites that block framing', () => {
    const { container } = render(<BrowserApp />);
    type('google.com');
    expect(container.querySelector('iframe')).toBeNull();
    expect(
      screen.getByText("google.com can't be shown here"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open google.com in a new tab' }),
    ).toHaveAttribute('href', 'https://google.com/');
  });

  it('refuses javascript: URLs', () => {
    const { container } = render(<BrowserApp />);
    type('javascript:alert(document.cookie)');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only http:// and https://',
    );
    expect(container.querySelector('iframe')).toBeNull();
  });
});
