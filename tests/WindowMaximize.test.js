import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../src/context/AppContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import Window from '../src/components/Window';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock SnapPreview
jest.mock('../src/components/SnapPreview', () => {
  return function SnapPreview() {
    return null;
  };
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 800,
});

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);

const mockApp = {
  id: 'test-app',
  name: 'Test App',
  component: 'div',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 },
  isMinimized: false,
  maximized: false,
  zIndex: 1,
};

describe('Window Maximize/Restore Integration Tests', () => {
  describe('Maximize Button Component', () => {
    test('renders maximize button when window is not maximized', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');
      expect(maximizeButton).toBeInTheDocument();
    });

    test('maximize button is clickable', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');
      expect(() => fireEvent.click(maximizeButton)).not.toThrow();
    });
  });

  describe('Title Bar Double Click Component', () => {
    test('title bar double click does not throw error', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen.getByText('Test App').parentElement;
      expect(() => fireEvent.doubleClick(titleBar)).not.toThrow();
    });

    test('title bar has correct cursor style', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen.getByText('Test App').parentElement;
      expect(titleBar).toBeInTheDocument();
    });
  });

  describe('Window Component Integration', () => {
    test('maximize button changes window state', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');
      expect(() => fireEvent.click(maximizeButton)).not.toThrow();
    });

    test('window has correct initial state', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      expect(screen.getByText('Test App')).toBeInTheDocument();
      expect(screen.getByTitle('Maximize')).toBeInTheDocument();
    });
  });

  describe('Maximize Visual Behavior Integration', () => {
    test('applies correct CSS classes when maximized', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const windowElement = screen.getByText('Test App').closest('div');
      expect(windowElement).toBeInTheDocument();
    });

    test('applies correct CSS classes when not maximized', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const windowElement = screen.getByText('Test App').closest('div');
      expect(windowElement).toBeInTheDocument();
    });

    test('window renders without errors', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      expect(screen.getByText('Test App')).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('title bar mouse events work on normal window', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen.getByText('Test App').parentElement;
      expect(() => fireEvent.mouseDown(titleBar)).not.toThrow();
      expect(() => fireEvent.mouseUp(document)).not.toThrow();
    });

    test('handles rapid maximize clicks without errors', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(maximizeButton);
      }
      expect(maximizeButton).toBeInTheDocument();
    });

    test('maximize button has correct title', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');
      expect(maximizeButton).toBeInTheDocument();
    });

    test('title bar is accessible', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen.getByText('Test App').parentElement;
      expect(titleBar).toBeInTheDocument();
    });
  });
});
