import { render, waitFor } from '@testing-library/react';
import useStartupSound, { STARTUP_SOUND_MP3 } from '@/hooks/useStartupSound';

let mockAuth;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function Probe() {
  useStartupSound();
  return null;
}

const enabledUser = {
  preferences: { sound: { startupSound: true } },
};

describe('useStartupSound', () => {
  beforeAll(() => {
    // jsdom does not implement HTMLMediaElement playback.
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue();
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  beforeEach(() => jest.clearAllMocks());

  it('points at the bundled startup sound file', () => {
    expect(STARTUP_SOUND_MP3).toBe('/sounds/orbitos-startup.mp3');
  });

  it('plays once when the user enabled the startup sound', async () => {
    mockAuth = { isLoading: false, isAuthenticated: true, user: enabledUser };
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    rerender(<Probe />);
    await waitFor(() =>
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
  });

  it('does not play when the preference is off or missing (default off)', () => {
    mockAuth = {
      isLoading: false,
      isAuthenticated: true,
      user: { preferences: {} },
    };
    render(<Probe />);

    mockAuth = {
      isLoading: false,
      isAuthenticated: true,
      user: { preferences: { sound: { startupSound: false } } },
    };
    render(<Probe />);

    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('does not play while auth is loading or when logged out', () => {
    mockAuth = { isLoading: true, isAuthenticated: false, user: null };
    render(<Probe />);

    mockAuth = { isLoading: false, isAuthenticated: false, user: null };
    render(<Probe />);

    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('retries once on the next user gesture when autoplay is blocked', async () => {
    window.HTMLMediaElement.prototype.play
      .mockRejectedValueOnce(new Error('autoplay blocked'))
      .mockResolvedValue();
    mockAuth = { isLoading: false, isAuthenticated: true, user: enabledUser };
    render(<Probe />);

    await waitFor(() =>
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );

    const { fireEvent } = require('@testing-library/react');
    fireEvent.pointerDown(window);
    await waitFor(() =>
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );

    // The first gesture removes BOTH listeners — a later key press must
    // not restart the sound.
    fireEvent.keyDown(window, { key: 'a' });
    await new Promise((r) => setTimeout(r, 20));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });
});
