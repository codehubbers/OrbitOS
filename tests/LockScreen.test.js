// Tests for the lock screen (#98): server-side password check, the overlay
// and the Ctrl+Alt+L shortcut.
import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import verifyPassword from '@/pages/api/auth/verify-password';
import LockScreen from '@/components/LockScreen';
import useLockScreen, {
  LOCK_STORAGE_KEY,
  isLockShortcut,
} from '@/hooks/useLockScreen';
import { AuthError } from '@/lib/authErrors';
import User from '@/models/User';

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/auth', () => ({
  hasLocalAdminSession: jest.fn(() => false),
  verifyToken: jest.fn().mockResolvedValue({ _id: 'user-1' }),
}));
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

const response = () => {
  const res = {
    statusCode: 200,
    setHeader: jest.fn(),
    status: jest.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((body) => {
      res.body = body;
      return res;
    }),
  };
  return res;
};

const post = (body) => ({ method: 'POST', body, headers: {} });

describe('POST /api/auth/verify-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('unlocks when bcrypt says the password matches', async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue({ comparePassword });
    const res = response();
    await verifyPassword(post({ password: 'right' }), res);
    expect(User.findById).toHaveBeenCalledWith('user-1');
    expect(comparePassword).toHaveBeenCalledWith('right');
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 401 for a wrong password', async () => {
    User.findById.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
    });
    const res = response();
    await verifyPassword(post({ password: 'wrong' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Wrong password' });
  });

  it('returns 401 when the session is missing', async () => {
    const { verifyToken } = jest.requireMock('@/lib/auth');
    verifyToken.mockRejectedValueOnce(new AuthError('No token provided'));
    const res = response();
    await verifyPassword(post({ password: 'x' }), res);
    expect(res.statusCode).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it.each([undefined, '', { $ne: null }, 'x'.repeat(129)])(
    'returns 400 for password %p',
    async (password) => {
      const res = response();
      await verifyPassword(post({ password }), res);
      expect(res.statusCode).toBe(400);
    },
  );

  it('unlocks the local dev admin without touching the database', async () => {
    const { hasLocalAdminSession } = jest.requireMock('@/lib/auth');
    const dbConnect = jest.requireMock('@/lib/mongodb').default;
    hasLocalAdminSession.mockReturnValueOnce(true);
    const res = response();
    await verifyPassword(post({ password: 'anything' }), res);
    expect(res.body).toEqual({ ok: true });
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it('unlocks the local dev admin with no password at all', async () => {
    const { hasLocalAdminSession } = jest.requireMock('@/lib/auth');
    hasLocalAdminSession.mockReturnValueOnce(true);
    const res = response();
    await verifyPassword(post({}), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('only accepts POST', async () => {
    const res = response();
    await verifyPassword({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });
});

describe('LockScreen', () => {
  const user = { displayName: 'Ada Lovelace', avatar: null };

  afterEach(() => {
    delete global.fetch;
  });

  it('shows the name and unlocks after the server accepts the password', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const onUnlock = jest.fn();
    render(<LockScreen user={user} onUnlock={onUnlock} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    await waitFor(() => expect(onUnlock).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/verify-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ password: 'secret' }),
      }),
    );
  });

  it('stays locked and shows an error for a wrong password', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Wrong password' }),
    });
    const onUnlock = jest.fn();
    render(<LockScreen user={user} onUnlock={onUnlock} />);

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'nope' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wrong password. Try again.',
    );
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it('lets the local dev admin unlock with Enter and no password field', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const onUnlock = jest.fn();
    const localAdmin = {
      _id: '000000000000000000000000',
      username: 'local-admin',
      displayName: 'Local Admin',
    };
    render(<LockScreen user={localAdmin} onUnlock={onUnlock} />);

    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Unlock' });
    expect(button).toHaveFocus();
    fireEvent.click(button);

    await waitFor(() => expect(onUnlock).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/verify-password',
      expect.objectContaining({ body: JSON.stringify({}) }),
    );
  });
});

describe('useLockScreen', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('recognises Ctrl+Alt+L and the Mac alias Cmd+Ctrl+L', () => {
    expect(isLockShortcut({ ctrlKey: true, altKey: true, key: 'l' })).toBe(
      true,
    );
    expect(isLockShortcut({ ctrlKey: true, metaKey: true, key: 'l' })).toBe(
      true,
    );
    expect(isLockShortcut({ ctrlKey: true, altKey: false, key: 'l' })).toBe(
      false,
    );
    expect(isLockShortcut({ metaKey: true, key: 'l' })).toBe(false);
    expect(
      isLockShortcut({ ctrlKey: true, altKey: true, shiftKey: true, key: 'L' }),
    ).toBe(false);
  });

  it('works when macOS turns Option+L into "¬" (falls back to key code)', () => {
    expect(
      isLockShortcut({ ctrlKey: true, altKey: true, key: '¬', code: 'KeyL' }),
    ).toBe(true);
    expect(
      isLockShortcut({ ctrlKey: true, metaKey: true, key: '¬', code: 'KeyL' }),
    ).toBe(true);
  });

  it('locks on the shortcut and survives a reload', () => {
    const { result } = renderHook(() => useLockScreen());
    expect(result.current.locked).toBe(false);

    act(() => {
      fireEvent.keyDown(window, { key: 'l', ctrlKey: true, altKey: true });
    });
    expect(result.current.locked).toBe(true);
    expect(window.sessionStorage.getItem(LOCK_STORAGE_KEY)).toBe('1');

    // A new mount (page reload) reads the stored state.
    const reloaded = renderHook(() => useLockScreen());
    expect(reloaded.result.current.locked).toBe(true);

    act(() => reloaded.result.current.unlock());
    expect(window.sessionStorage.getItem(LOCK_STORAGE_KEY)).toBeNull();
  });

  it('does nothing while signed out', () => {
    const { result } = renderHook(() => useLockScreen({ enabled: false }));
    act(() => {
      fireEvent.keyDown(window, { key: 'l', ctrlKey: true, altKey: true });
    });
    expect(result.current.locked).toBe(false);
  });
});

describe('useLockScreen idle timeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => jest.useRealTimers());

  it('locks after the configured idle time (default 10 min)', () => {
    const { result } = renderHook(() => useLockScreen());
    act(() => jest.advanceTimersByTime(10 * 60 * 1000 - 1000));
    expect(result.current.locked).toBe(false);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.locked).toBe(true);
  });

  it('activity resets the countdown', () => {
    const { result } = renderHook(() => useLockScreen({ idleMinutes: 10 }));

    act(() => jest.advanceTimersByTime(9 * 60 * 1000));
    // 9 minutes in, the user moves the mouse — the countdown starts over.
    // (The listener is throttled at 5s, and 9 minutes clears that easily.)
    act(() => {
      fireEvent.pointerDown(window);
      jest.advanceTimersByTime(9 * 60 * 1000);
    });
    expect(result.current.locked).toBe(false);

    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(result.current.locked).toBe(true);
  });

  it('never locks when idleMinutes is 0 ("Never" in Settings)', () => {
    const { result } = renderHook(() => useLockScreen({ idleMinutes: 0 }));
    act(() => jest.advanceTimersByTime(2 * 60 * 60 * 1000));
    expect(result.current.locked).toBe(false);
  });

  it('stays idle (no double lock) while the screen is already locked', () => {
    const { result } = renderHook(() => useLockScreen({ idleMinutes: 10 }));
    act(() => result.current.lock());
    // Time passes while locked; unlocking afterwards must not instantly
    // re-lock from a stale timer.
    act(() => jest.advanceTimersByTime(30 * 60 * 1000));
    act(() => result.current.unlock());
    expect(result.current.locked).toBe(false);
    // The fresh countdown starts after the unlock.
    act(() => jest.advanceTimersByTime(10 * 60 * 1000 - 1000));
    expect(result.current.locked).toBe(false);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.locked).toBe(true);
  });
});
