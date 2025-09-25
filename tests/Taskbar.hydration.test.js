const { render, screen, act } = require('@testing-library/react');
const React = require('react');

// Mock the AppContext
const mockState = {
  openApps: [],
  activeApp: null,
};

const mockDispatch = jest.fn();

jest.mock('../src/context/AppContext', () => ({
  useApp: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

// Mock the ThemeContext
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      taskbar: 'bg-white/50 border-t border-[#d1d5db]',
      text: { primary: 'text-[#111827]' },
    },
  }),
}));

// Mock the AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
}));

const Taskbar = require('../src/components/Taskbar').default;

describe('Taskbar Hydration Error Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clock element exists and has correct data-testid', () => {
    render(React.createElement(Taskbar));

    const clockElement = screen.getByTestId('clock');
    expect(clockElement).toBeInTheDocument();
  });

  test('clock shows time format after component mounts', async () => {
    render(React.createElement(Taskbar));

    // Let the effects run
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    const clockElement = screen.getByTestId('clock');
    // Just check that it shows some time format, not empty
    expect(clockElement.textContent).not.toBe('');
    expect(clockElement.textContent).toMatch(/[\d:apm]/i);
  });
});
