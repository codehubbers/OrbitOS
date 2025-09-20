const { render, screen, act } = require('@testing-library/react');
const React = require('react');

// Mock the AppContext
const mockState = {
  openApps: [],
  activeApp: null
};

const mockDispatch = jest.fn();

jest.mock('../src/context/AppContext', () => ({
  useApp: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
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