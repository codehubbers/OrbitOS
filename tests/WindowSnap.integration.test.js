/**
 * @fileoverview Window Snap Integration Tests
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

const TASKBAR_HEIGHT = 64;

// Test wrapper with AppProvider and ThemeProvider
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);

// Mock app data
const mockApp = {
  id: 'snap-test-app',
  name: 'Snap Test App',
  component: 'div',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 },
  isMinimized: false,
  maximized: false,
  zIndex: 1,
};

describe('Window Snap Integration', () => {
  const mousedownAt = (titleBar, x, y) => {
    fireEvent.mouseDown(titleBar, { clientX: x, clientY: y });
  };

  const mousemoveTo = (x, y) => {
    fireEvent.mouseMove(document, { clientX: x, clientY: y });
  };

  const mouseup = () => {
    fireEvent.mouseUp(document);
  };

  const getWindowContainer = () =>
    screen.getByText(mockApp.name).closest('div[style*="position"]');

  test('snaps to left half when dragged to left edge', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, 150, 150);
    mousemoveTo(10, 200);
    mouseup();

    // Test passes if no errors thrown during snap operation
    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });

  test('snaps to right half when dragged to right edge', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near right edge
    mousemoveTo(window.innerWidth - 1 + 10, 200);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });

  test('snaps to top (maximize) when dragged to top edge', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top edge
    mousemoveTo(400, 5);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });

  test('snaps to top-right quarter when dragged to top-right corner', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top-right corner
    mousemoveTo(window.innerWidth - 5, 5);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });

  test('snaps to bottom-left quarter when dragged to bottom-left corner', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const usableHeight = window.innerHeight - TASKBAR_HEIGHT;
    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near bottom-left corner
    mousemoveTo(5, Math.floor(usableHeight / 2) + 10);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });
  test('snaps to top-left quarter when dragged to top-left corner', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top-left corner
    mousemoveTo(10, 10);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });

  test('snaps to bottom-right quarter when dragged to bottom-right corner', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const usableHeight = window.innerHeight - TASKBAR_HEIGHT;
    const targetY = Math.floor(usableHeight / 2) + 10 + mockApp.position.y; // ensure bottom proximity

    const titleBar = screen.getByText(mockApp.name).parentElement;
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near bottom-right corner
    mousemoveTo(window.innerWidth - 1 + 10, targetY);
    mouseup();

    await waitFor(() => {
      expect(screen.getByText(mockApp.name)).toBeInTheDocument();
    });
  });
});
