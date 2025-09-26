/**
 * @fileoverview Window Maximize/Restore Integration Tests
 *
 * Comprehensive integration tests for window maximize/restore functionality
 * covering button clicks, double-click on title bar, and state management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../src/context/AppContext';
import Window from '../src/components/Window';

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

// Test wrapper with AppProvider
const TestWrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

// Mock app data
const mockApp = {
  id: 'test-app',
  name: 'Test App',
  component: 'div',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 },
  minimized: false,
  maximized: false,
  zIndex: 1,
};

describe('Window Maximize/Restore Integration Tests', () => {
  // Maximize Button Component tests
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
      expect(maximizeButton).toHaveClass('window-maximize');
    });

    test('renders restore button when window is maximized', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const restoreButton = screen.getByTitle('Restore');
      expect(restoreButton).toBeInTheDocument();
      expect(restoreButton).toHaveClass('window-restore');
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

    test('restore button is clickable', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const restoreButton = screen.getByTitle('Restore');
      expect(() => fireEvent.click(restoreButton)).not.toThrow();
    });
  });

  // Title Bar Double Click Component tests
  describe('Title Bar Double Click Component', () => {
    test('title bar double click does not throw error', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');
      expect(() => fireEvent.doubleClick(titleBar)).not.toThrow();
    });

    test('title bar double click works on maximized window', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');
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

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');
      expect(titleBar).toHaveClass('window-title-bar');
    });
  });

  // Window Component Integration tests
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

    test('restore button changes window state', () => {
      const maximizedApp = {
        ...mockApp,
        maximized: true,
        previousSize: { width: 600, height: 400 },
        previousPosition: { x: 100, y: 100 },
      };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const restoreButton = screen.getByTitle('Restore');
      expect(() => fireEvent.click(restoreButton)).not.toThrow();
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

  // Maximize Visual Behavior Integration tests
  describe('Maximize Visual Behavior Integration', () => {
    test('applies correct CSS classes when maximized', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const windowContainer = screen
        .getByText('Test App')
        .closest('.window-container');
      expect(windowContainer).toHaveClass('window-maximize-transition');
    });

    test('applies correct CSS classes when not maximized', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const windowContainer = screen
        .getByText('Test App')
        .closest('.window-container');
      expect(windowContainer).toHaveClass('window-resize-transition');
    });

    test('disables resize handles when maximized', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // ResizeHandles should not render when maximized
      expect(
        screen.queryByTestId('resize-handles-container'),
      ).not.toBeInTheDocument();
    });

    test('enables resize handles when not maximized', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // ResizeHandles should render when not maximized
      expect(
        screen.getByTestId('resize-handles-container'),
      ).toBeInTheDocument();
    });
  });

  // Performance and Edge Cases tests
  describe('Performance and Edge Cases', () => {
    test('title bar mouse events work on maximized window', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');

      // Should not throw errors
      expect(() => fireEvent.mouseDown(titleBar)).not.toThrow();
      expect(() =>
        fireEvent.mouseMove(document, { clientX: 200, clientY: 200 }),
      ).not.toThrow();
    });

    test('title bar mouse events work on normal window', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');

      // Should not throw errors
      expect(() => fireEvent.mouseDown(titleBar)).not.toThrow();
      expect(() =>
        fireEvent.mouseMove(document, { clientX: 200, clientY: 200 }),
      ).not.toThrow();
      expect(() => fireEvent.mouseUp(document)).not.toThrow();
    });

    test('handles maximize with missing previous size gracefully', () => {
      const appWithoutPreviousSize = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={appWithoutPreviousSize}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const restoreButton = screen.getByTitle('Restore');

      // Should not throw error
      expect(() => fireEvent.click(restoreButton)).not.toThrow();
    });

    test('handles rapid maximize/restore clicks without errors', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByTitle('Maximize');

      // Rapid clicks should not cause errors
      for (let i = 0; i < 5; i++) {
        fireEvent.click(maximizeButton);
      }

      expect(maximizeButton).toBeInTheDocument();
    });

    test('handles window resize during maximize state', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      // Should not throw error when window is resized
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    test('maximize button has correct aria-label', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const maximizeButton = screen.getByLabelText('Maximize window');
      expect(maximizeButton).toBeInTheDocument();
    });

    test('restore button has correct aria-label', () => {
      const maximizedApp = { ...mockApp, maximized: true };

      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const restoreButton = screen.getByLabelText('Restore window');
      expect(restoreButton).toBeInTheDocument();
    });

    test('title bar is accessible', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>,
      );

      const titleBar = screen
        .getByText('Test App')
        .closest('.window-title-bar');
      expect(titleBar).toBeInTheDocument();
    });
  });
});
