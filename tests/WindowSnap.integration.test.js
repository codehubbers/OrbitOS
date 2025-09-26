/**
 * @fileoverview Window Snap Integration Tests
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

const TASKBAR_HEIGHT = 64;

// Test wrapper with AppProvider
const TestWrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

// Mock app data
const mockApp = {
  id: 'snap-test-app',
  name: 'Snap Test App',
  component: 'div',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 },
  minimized: false,
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
    screen.getByText(mockApp.name).closest('.window-container');

  test('snaps to left half when dragged to left edge', async () => {
    render(
      <TestWrapper>
        <Window app={mockApp}>
          <div>Content</div>
        </Window>
      </TestWrapper>,
    );

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    // Start drag from within the title bar
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near left edge (keep same offset so newPosition.x ~ 0)
    mousemoveTo(10, 200);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({ left: '0px', top: '0px' });
      expect(container).toHaveStyle({ width: `${window.innerWidth / 2}px` });
      expect(container).toHaveStyle({
        height: `${window.innerHeight - TASKBAR_HEIGHT}px`,
      });
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

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near right edge
    mousemoveTo(window.innerWidth - 1 + 10, 200);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({
        left: `${Math.ceil(window.innerWidth / 2)}px`,
        top: '0px',
      });
      expect(container).toHaveStyle({
        width: `${Math.floor(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        height: `${window.innerHeight - TASKBAR_HEIGHT}px`,
      });
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

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top edge
    mousemoveTo(400, 5);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      // Maximized state removes border radius; we assert size/position via inline styles
      expect(container).toHaveStyle({ left: '0px', top: '0px' });
      expect(container).toHaveStyle({ width: `${window.innerWidth}px` });
      expect(container).toHaveStyle({
        height: `${window.innerHeight - TASKBAR_HEIGHT}px`,
      });
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

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top-right corner
    mousemoveTo(window.innerWidth - 5, 5);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({
        left: `${Math.floor(window.innerWidth / 2)}px`,
        top: '0px',
      });
      expect(container).toHaveStyle({
        width: `${Math.ceil(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        height: `${Math.floor((window.innerHeight - TASKBAR_HEIGHT) / 2)}px`,
      });
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
    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near bottom-left corner
    mousemoveTo(5, Math.floor(usableHeight / 2) + 10);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({
        left: '0px',
        top: `${Math.floor(usableHeight / 2)}px`,
      });
      expect(container).toHaveStyle({
        width: `${Math.floor(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        height: `${Math.ceil(usableHeight / 2)}px`,
      });
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

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near top-left corner
    mousemoveTo(10, 10);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({ left: '0px', top: '0px' });
      expect(container).toHaveStyle({
        width: `${Math.floor(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        height: `${Math.floor((window.innerHeight - TASKBAR_HEIGHT) / 2)}px`,
      });
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

    const titleBar = screen
      .getByText(mockApp.name)
      .closest('.window-title-bar');
    mousedownAt(titleBar, mockApp.position.x + 10, mockApp.position.y + 10);
    // Move near bottom-right corner
    mousemoveTo(window.innerWidth - 1 + 10, targetY);
    mouseup();

    const container = getWindowContainer();
    await waitFor(() => {
      expect(container).toHaveStyle({
        left: `${Math.floor(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        top: `${Math.floor(usableHeight / 2)}px`,
      });
      expect(container).toHaveStyle({
        width: `${Math.ceil(window.innerWidth / 2)}px`,
      });
      expect(container).toHaveStyle({
        height: `${Math.ceil(usableHeight / 2)}px`,
      });
    });
  });
});
