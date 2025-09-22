/**
 * @fileoverview Window Resize Integration Tests
 * 
 * Comprehensive integration tests for window resize functionality
 * covering components, hooks, and strategy patterns.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../src/context/AppContext';
import Window from '../src/components/Window';
import ResizeHandle from '../src/system/components/ResizeHandle';
import ResizeHandles from '../src/system/components/ResizeHandles';
import ResizeStrategyRegistry from '../src/system/services/ResizeStrategies';

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
const TestWrapper = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

// Mock app data
const mockApp = {
  id: 'test-app',
  name: 'Test App',
  component: 'div',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 },
  minimized: false,
  maximized: false,
  zIndex: 1
};

describe('Window Resize Integration Tests', () => {
  
  // ResizeHandle Component tests
  describe('ResizeHandle Component', () => {
    test('renders resize handle with correct direction', () => {
      const mockOnMouseDown = jest.fn();
      
      render(
        <ResizeHandle
          direction="bottom-right"
          onMouseDown={mockOnMouseDown}
        />
      );
      
      const handle = screen.getByTestId('resize-handle-bottom-right');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveAttribute('data-direction', 'bottom-right');
    });

    test('calls onMouseDown when handle is clicked', () => {
      const mockOnMouseDown = jest.fn();
      
      render(
        <ResizeHandle
          direction="top-left"
          onMouseDown={mockOnMouseDown}
        />
      );
      
      const handle = screen.getByTestId('resize-handle-top-left');
      fireEvent.mouseDown(handle);
      
      expect(mockOnMouseDown).toHaveBeenCalledWith('top-left', expect.any(Object));
    });

    test('does not call onMouseDown when disabled', () => {
      const mockOnMouseDown = jest.fn();
      
      render(
        <ResizeHandle
          direction="right"
          onMouseDown={mockOnMouseDown}
          disabled={true}
        />
      );
      
      const handle = screen.getByTestId('resize-handle-right');
      fireEvent.mouseDown(handle);
      
      expect(mockOnMouseDown).not.toHaveBeenCalled();
    });

    test('applies correct cursor styles for different directions', () => {
      const directions = [
        { direction: 'top-left', expectedCursor: 'nw-resize' },
        { direction: 'top-right', expectedCursor: 'ne-resize' },
        { direction: 'bottom-left', expectedCursor: 'sw-resize' },
        { direction: 'bottom-right', expectedCursor: 'se-resize' },
        { direction: 'top', expectedCursor: 'n-resize' },
        { direction: 'bottom', expectedCursor: 's-resize' },
        { direction: 'left', expectedCursor: 'w-resize' },
        { direction: 'right', expectedCursor: 'e-resize' },
      ];

      directions.forEach(({ direction, expectedCursor }) => {
        const { unmount } = render(
          <ResizeHandle
            direction={direction}
            onMouseDown={jest.fn()}
          />
        );
        
        const handle = screen.getByTestId(`resize-handle-${direction}`);
        expect(handle).toHaveStyle(`cursor: ${expectedCursor}`);
        
        unmount();
      });
    });
  });

  // ResizeHandles Component tests
  describe('ResizeHandles Component', () => {
    test('renders all 8 resize handles', () => {
      const mockOnResizeStart = jest.fn();
      
      render(
        <ResizeHandles onResizeStart={mockOnResizeStart} />
      );
      
      const directions = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'top', 'bottom', 'left', 'right'
      ];
      
      directions.forEach(direction => {
        expect(screen.getByTestId(`resize-handle-${direction}`)).toBeInTheDocument();
      });
    });

    test('does not render handles when disabled', () => {
      const mockOnResizeStart = jest.fn();
      
      render(
        <ResizeHandles 
          onResizeStart={mockOnResizeStart} 
          disabled={true}
        />
      );
      
      expect(screen.queryByTestId('resize-handles-container')).not.toBeInTheDocument();
    });

    test('does not render handles when showHandles is false', () => {
      const mockOnResizeStart = jest.fn();
      
      render(
        <ResizeHandles 
          onResizeStart={mockOnResizeStart} 
          showHandles={false}
        />
      );
      
      expect(screen.queryByTestId('resize-handles-container')).not.toBeInTheDocument();
    });
  });

  // Window Component Integration tests
  describe('Window Component Integration', () => {
    test('renders window with resize handles', () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>
      );
      
      expect(screen.getByText('Test App')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handles-container')).toBeInTheDocument();
    });

    test('disables resize handles when window is maximized', () => {
      const maximizedApp = { ...mockApp, maximized: true };
      
      render(
        <TestWrapper>
          <Window app={maximizedApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>
      );
      
      // ResizeHandles should not render when maximized
      expect(screen.queryByTestId('resize-handles-container')).not.toBeInTheDocument();
    });

    test('handles resize start correctly', async () => {
      render(
        <TestWrapper>
          <Window app={mockApp}>
            <div>Test Content</div>
          </Window>
        </TestWrapper>
      );
      
      const resizeHandle = screen.getByTestId('resize-handle-bottom-right');
      
      fireEvent.mouseDown(resizeHandle);
      
      // Should not throw any errors
      await waitFor(() => {
        expect(resizeHandle).toBeInTheDocument();
      });
    });
  });

  // Resize Strategy Integration tests
  describe('Resize Strategy Integration', () => {
    test('right resize strategy calculates correct new size', () => {
      const strategy = ResizeStrategyRegistry.getStrategy('right');
      
      const params = {
        deltaX: 50,
        deltaY: 0,
        currentSize: { width: 600, height: 400 },
        currentPosition: { x: 100, y: 100 },
        minSize: { width: 200, height: 150 },
        maxSize: { width: 1200, height: 800 }
      };
      
      const result = strategy.calculate(params);
      
      expect(result.size.width).toBe(650); // 600 + 50
      expect(result.size.height).toBe(400); // unchanged
      expect(result.position.x).toBe(100); // unchanged
      expect(result.position.y).toBe(100); // unchanged
    });

    test('bottom-right resize strategy calculates correct new size and position', () => {
      const strategy = ResizeStrategyRegistry.getStrategy('bottom-right');
      
      const params = {
        deltaX: 50,
        deltaY: 30,
        currentSize: { width: 600, height: 400 },
        currentPosition: { x: 100, y: 100 },
        minSize: { width: 200, height: 150 },
        maxSize: { width: 1200, height: 800 }
      };
      
      const result = strategy.calculate(params);
      
      expect(result.size.width).toBe(650); // 600 + 50
      expect(result.size.height).toBe(430); // 400 + 30
      expect(result.position.x).toBe(100); // unchanged
      expect(result.position.y).toBe(100); // unchanged
    });

    test('constraints are applied correctly', () => {
      const strategy = ResizeStrategyRegistry.getStrategy('right');
      
      const params = {
        deltaX: 1000, // Very large delta
        deltaY: 0,
        currentSize: { width: 600, height: 400 },
        currentPosition: { x: 100, y: 100 },
        minSize: { width: 200, height: 150 },
        maxSize: { width: 1200, height: 800 }
      };
      
      const result = strategy.calculate(params);
      
      // Should be constrained to maxSize
      expect(result.size.width).toBe(1200);
      expect(result.size.height).toBe(400);
    });

    test('all resize directions are available', () => {
      const availableDirections = ResizeStrategyRegistry.getAvailableDirections();
      
      const expectedDirections = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'top', 'bottom', 'left', 'right'
      ];
      
      expect(availableDirections).toEqual(expect.arrayContaining(expectedDirections));
      expect(availableDirections).toHaveLength(8);
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
        </TestWrapper>
      );
      
      const resizeHandle = screen.getByTestId('resize-handle-bottom-right');
      
      // Simulate rapid mouse events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseDown(resizeHandle);
        fireEvent.mouseMove(document, { clientX: 100 + i, clientY: 100 + i });
      }
      
      fireEvent.mouseUp(document);
      
      // Should not throw any errors
      await waitFor(() => {
        expect(resizeHandle).toBeInTheDocument();
      });
    });

    test('handles window resize with zero dimensions gracefully', () => {
      const strategy = ResizeStrategyRegistry.getStrategy('right');
      
      const params = {
        deltaX: 50,
        deltaY: 0,
        currentSize: { width: 0, height: 0 },
        currentPosition: { x: 0, y: 0 },
        minSize: { width: 200, height: 150 },
        maxSize: { width: 1200, height: 800 }
      };
      
      const result = strategy.calculate(params);
      
      // Should apply minimum constraints
      expect(result.size.width).toBe(200);
      expect(result.size.height).toBe(150);
    });
  });
});
