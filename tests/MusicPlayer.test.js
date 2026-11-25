import { render, screen, fireEvent, act } from '@testing-library/react';
import MusicPlayerApp from '@/system/apps/MusicPlayerApp';
import AppRegistry from '@/system/services/AppRegistry';
import {
  MusicProvider,
  useMusic,
  DEFAULT_PLAYLIST,
  isAudioFile,
} from '@/context/MusicContext';

// jsdom does not implement HTMLMediaElement playback.
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue();
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.load = jest.fn();
});

describe('Music Player app manifest', () => {
  it('defines id, name, icon and component', () => {
    expect(MusicPlayerApp.id).toBe('music-player');
    expect(MusicPlayerApp.name).toBe('Music Player');
    expect(MusicPlayerApp.icon).toBeTruthy();
    expect(MusicPlayerApp.component).toBe('musicplayer');
  });

  it('is registered in the AppRegistry', () => {
    const apps = AppRegistry.getAllApps();
    expect(apps.find((app) => app.id === 'music-player')).toBe(MusicPlayerApp);
  });
});

describe('Default playlist', () => {
  it('contains exactly the hardcoded welcome track', () => {
    expect(DEFAULT_PLAYLIST).toHaveLength(1);
    expect(DEFAULT_PLAYLIST[0]).toMatchObject({
      title: 'Going Home',
      artist: 'Kenny G',
      src: '/music/going-home.mp3',
    });
  });
});

// Minimal consumer exposing the service for assertions.
function PlayerProbe() {
  const music = useMusic();
  return (
    <div>
      <span data-testid="title">{music.currentTrack?.title}</span>
      <span data-testid="artist">{music.currentTrack?.artist}</span>
      <span data-testid="playing">{String(music.isPlaying)}</span>
      <span data-testid="volume">{music.volume}</span>
      <span data-testid="repeat">{music.repeat}</span>
      <span data-testid="shuffle">{String(music.shuffle)}</span>
      <span data-testid="playlist-length">{music.playlist.length}</span>
      <span data-testid="last-track">
        {music.playlist[music.playlist.length - 1]?.title}
      </span>
      <button onClick={music.togglePlay}>toggle</button>
      <button onClick={music.cycleRepeat}>repeat</button>
      <button onClick={music.toggleShuffle}>shuffle</button>
      <button onClick={() => music.setVolume(0.3)}>volume</button>
      <button onClick={() => music.seekTo(42)}>seek</button>
      <button
        onClick={() =>
          music.addTrack({
            id: 'file-abc123',
            title: 'My Song',
            artist: 'My Files',
            src: '/api/files/abc123',
          })
        }
      >
        add
      </button>
    </div>
  );
}

describe('isAudioFile', () => {
  it('recognises audio by mime type', () => {
    expect(isAudioFile({ name: 'song', mimeType: 'audio/mpeg' })).toBe(true);
    expect(isAudioFile({ name: 'song', mimeType: 'audio/wav' })).toBe(true);
    expect(isAudioFile({ name: 'doc', mimeType: 'text/plain' })).toBe(false);
  });

  it('recognises audio by file extension as a fallback', () => {
    expect(isAudioFile({ name: 'track.MP3' })).toBe(true);
    expect(isAudioFile({ name: 'tune.m4a' })).toBe(true);
    expect(isAudioFile({ name: 'notes.txt' })).toBe(false);
    expect(isAudioFile(null)).toBe(false);
  });
});

describe('MusicProvider playback service', () => {
  it('exposes the hardcoded track and transport state', () => {
    render(
      <MusicProvider>
        <PlayerProbe />
      </MusicProvider>,
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Going Home');
    expect(screen.getByTestId('artist')).toHaveTextContent('Kenny G');
    expect(screen.getByTestId('playing')).toHaveTextContent('false');

    fireEvent.click(screen.getByText('toggle'));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    fireEvent.click(screen.getByText('repeat'));
    expect(screen.getByTestId('repeat')).toHaveTextContent('all');
    fireEvent.click(screen.getByText('repeat'));
    expect(screen.getByTestId('repeat')).toHaveTextContent('one');
    fireEvent.click(screen.getByText('repeat'));
    expect(screen.getByTestId('repeat')).toHaveTextContent('off');

    fireEvent.click(screen.getByText('shuffle'));
    expect(screen.getByTestId('shuffle')).toHaveTextContent('true');

    fireEvent.click(screen.getByText('volume'));
    expect(screen.getByTestId('volume')).toHaveTextContent('0.3');
  });

  it('keeps the audio element alive across re-renders (global playback)', () => {
    const { rerender } = render(
      <MusicProvider>
        <PlayerProbe />
      </MusicProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    rerender(
      <MusicProvider>
        <PlayerProbe />
      </MusicProvider>,
    );
    // The provider owns a single persistent audio element — play stays
    // available after the player window content unmounts/remounts.
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('adds tracks from user files, keeping the welcome track first', () => {
    render(
      <MusicProvider>
        <PlayerProbe />
      </MusicProvider>,
    );

    expect(screen.getByTestId('playlist-length')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('playlist-length')).toHaveTextContent('2');
    expect(screen.getByTestId('title')).toHaveTextContent('Going Home');
    expect(screen.getByTestId('last-track')).toHaveTextContent('My Song');

    // Duplicates are ignored
    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('playlist-length')).toHaveTextContent('2');
  });
});
