// Lock screen overlay (#98): clock and date over the blurred wallpaper,
// the user's avatar and name, and a password field checked on the server.
//
// Windows stay mounted underneath (Desktop marks them inert), so nothing
// is lost while locked.

import { useEffect, useRef, useState } from 'react';

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (date) =>
  date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

// The local dev admin (NEXT_PUBLIC_ENABLE_LOCAL_ADMIN on localhost) has no
// password, so its lock screen unlocks with just Enter / a click.
const LOCAL_ADMIN_ID = '000000000000000000000000';

export default function LockScreen({ user, wallpaper, onUnlock }) {
  const [now, setNow] = useState(() => new Date());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  const isLocalAdmin = user?._id === LOCAL_ADMIN_ID;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (isLocalAdmin ? buttonRef : inputRef).current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = user?.displayName || user?.username || 'User';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!isLocalAdmin && !password) || checking) return;
    setChecking(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isLocalAdmin ? {} : { password }),
      });
      if (response.ok) {
        setPassword('');
        onUnlock();
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(
        response.status === 401
          ? 'Wrong password. Try again.'
          : data.error || "Couldn't unlock. Try again.",
      );
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setChecking(false);
      setPassword('');
      (isLocalAdmin ? buttonRef : inputRef).current?.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OrbitOS is locked"
      data-testid="lock-screen"
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl brightness-75"
        style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}
      />
      <div className="relative flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-7xl font-light tabular-nums">{formatTime(now)}</p>
          <p className="mt-2 text-lg opacity-90">{formatDate(now)}</p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-2 ring-white/60"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl ring-2 ring-white/60"
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-xl font-medium">{name}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-2"
        >
          {isLocalAdmin ? (
            <>
              <button
                ref={buttonRef}
                type="submit"
                disabled={checking}
                className="rounded-md bg-white/25 px-6 py-2 hover:bg-white/35 disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Unlock'}
              </button>
              <p className="text-sm text-white/70">
                Local dev admin — just press Enter
              </p>
            </>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="lock-password" className="sr-only">
                Password
              </label>
              <input
                id="lock-password"
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                disabled={checking}
                className="w-64 rounded-md bg-white/20 px-3 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-white/70"
              />
              <button
                type="submit"
                disabled={!password || checking}
                className="rounded-md bg-white/25 px-4 py-2 hover:bg-white/35 disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Unlock'}
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-200">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
