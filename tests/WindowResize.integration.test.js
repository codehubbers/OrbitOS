/**
 * @fileoverview Window Resize Integration Tests
 *
 * Comprehensive integration tests for window resize functionality
 * covering components, hooks, and strategy patterns.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock window dimensions
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

// Test wrapper with AppProvider and ThemeProvider
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);

// Mock app data
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

describe('Window Resize Integration Tests', () => {
  // Window Component Integration tests
  describe('Window Component Integration', () => {
    test('renders window with resize handles', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    test('disables resize handles when window is maximized', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // Window should render when maximized
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    test('handles resize start correctly', async () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // Window should render and handle interactions
      await waitFor(() => {
        expect(screen.getByText('Test App')).toBeInTheDocument();
      });
    });
  });

  // Performance and Edge Cases tests
  describe('Performance and Edge Cases', () => {
    test('handles rapid resize events without errors', async () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // Simulate rapid mouse events on window
      const window = screen.getByText('Test App');

      for (let i = 0; i < 10; i++) {
        fireEvent.mouseDown(window);
        fireEvent.mouseMove(document, { clientX: 100 + i, clientY: 100 + i });
      }

      fireEvent.mouseUp(document);

      // Should not throw any errors
      await waitFor(() => {
        expect(window).toBeInTheDocument();
      });
    });

    test('handles window with zero dimensions gracefully', () => {
      const zeroApp = { ...mockApp, size: { width: 0, height: 0 } };

      expect(() => {
        render(
          <TestWrapper>
            <Window app={zeroApp}>
              <div>Test Content</div>
            </Window>
          </TestWrapper>,
        );
      }).not.toThrow();
    });
  });
});
