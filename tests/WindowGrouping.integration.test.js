/**
 * @fileoverview Window Grouping Integration Tests
 *
 * Comprehensive integration tests for window grouping and tabbed interface functionality
 * covering components, hooks, services, and state management.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from '../src/context/AppContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import WindowGroupManager from '../src/system/components/WindowGroupManager';
import TabManager from '../src/components/TabManager';
import useWindowGrouping from '../src/hooks/useWindowGrouping';
import WindowGroupService from '../src/system/services/WindowGroupService';
import TabManagerService from '../src/system/services/TabManagerService';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node,
}));

// Test wrapper with providers
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);

// Mock app data
const mockApps = [
  {
    id: 'app-1',
    name: 'Notes',
    component: 'notes',
    icon: '📝',
    size: { width: 600, height: 400 },
    position: { x: 100, y: 100 },
    isMinimized: false,
    zIndex: 1,
    groupId: null,
  },
  {
    id: 'app-2',
    name: 'Calculator',
    component: 'calculator',
    icon: '🧮',
    size: { width: 300, height: 400 },
    position: { x: 200, y: 150 },
    isMinimized: false,
    zIndex: 2,
    groupId: null,
  },
  {
    id: 'app-3',
    name: 'Browser',
    component: 'browser',
    icon: '🌐',
    size: { width: 800, height: 600 },
    position: { x: 300, y: 200 },
    isMinimized: false,
    zIndex: 3,
    groupId: null,
  },
];

// Test component that uses useWindowGrouping hook
const TestWindowGroupingComponent = () => {
  const { state, dispatch } = useApp();

  const {
    isGrouping,
    selectedWindows,
    startGrouping,
    endGrouping,
    createGroup,
    addWindowToGroup,
    removeWindowFromGroup,
  } = useWindowGrouping({
    windows: state.openApps,
    dispatch,
  });

  return (
    <div>
      <div data-testid="grouping-status">
        {isGrouping ? 'Grouping Active' : 'Grouping Inactive'}
      </div>
      <div data-testid="selected-count">Selected: {selectedWindows.length}</div>
      <button data-testid="start-grouping" onClick={startGrouping}>
        Start Grouping
      </button>
      <button data-testid="end-grouping" onClick={endGrouping}>
        End Grouping
      </button>
      <button
        data-testid="create-group"
        onClick={() => createGroup('Test Group')}
        disabled={selectedWindows.length < 2}
      >
        Create Group
      </button>
    </div>
  );
};

describe('Window Grouping Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WindowGroupService', () => {
    test('should calculate group layout for multiple windows', () => {
      const layout = WindowGroupService.calculateGroupLayout(mockApps);

      expect(layout).toBeDefined();
      expect(layout.position).toBeDefined();
      expect(layout.size).toBeDefined();
      expect(layout.windows).toEqual(mockApps);
    });

    test('should detect windows that should be grouped', () => {
      const window1 = mockApps[0];
      const window2 = mockApps[1];

      const shouldGroup = WindowGroupService.shouldGroupWindows(
        window1,
        window2,
      );

      expect(typeof shouldGroup).toBe('boolean');
    });

    test('should arrange windows in cascade formation', () => {
      const arranged = WindowGroupService.arrangeWindowsInGroup(
        mockApps,
        'cascade',
      );

      expect(arranged).toHaveLength(mockApps.length);
      arranged.forEach((window, index) => {
        expect(window.position).toBeDefined();
        expect(window.size).toBeDefined();
      });
    });
  });

  describe('TabManagerService', () => {
    test('should create Tab Manager app for a group', () => {
      const group = {
        id: 'test-group',
        name: 'Test Group',
        position: { x: 100, y: 100 },
        size: { width: 600, height: 400 },
      };

      const tabManagerApp = TabManagerService.createTabManagerApp(group);

      expect(tabManagerApp.id).toBe('tab-manager-test-group');
      expect(tabManagerApp.name).toBe('Test Group');
      expect(tabManagerApp.component).toBe('tab-manager');
      expect(tabManagerApp.groupId).toBe('test-group');
    });

    test('should identify Tab Manager apps', () => {
      const tabManagerApp = {
        id: 'tab-manager-test',
        component: 'tab-manager',
      };

      const regularApp = {
        id: 'regular-app',
        component: 'notes',
      };

      expect(TabManagerService.isTabManager(tabManagerApp)).toBe(true);
      expect(TabManagerService.isTabManager(regularApp)).toBe(false);
    });

    test('should handle Tab Manager close with cleanup actions', () => {
      const group = {
        id: 'test-group',
        tabGroupId: 'tab-group-test',
        windows: ['app-1', 'app-2'],
      };

      const mockDispatch = jest.fn();
      const actions = TabManagerService.handleTabManagerClose({
        appId: 'tab-manager-test-group',
        groupId: 'test-group',
        group,
        dispatch: mockDispatch,
      });

      expect(actions).toHaveLength(5); // 2x Remove windows + destroy group + destroy tab group + close app
      expect(actions[0].type).toBe('REMOVE_WINDOW_FROM_GROUP');
      expect(actions[1].type).toBe('REMOVE_WINDOW_FROM_GROUP');
      expect(actions[2].type).toBe('DESTROY_WINDOW_GROUP');
      expect(actions[3].type).toBe('DESTROY_TAB_GROUP');
      expect(actions[4].type).toBe('CLOSE_APP');
    });
  });

  describe('useWindowGrouping Hook', () => {
    test('should initialize with correct default state', () => {
      render(
        <TestWrapper>
          <TestWindowGroupingComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('grouping-status')).toHaveTextContent(
        'Grouping Inactive',
      );
      expect(screen.getByTestId('selected-count')).toHaveTextContent(
        'Selected: 0',
      );
    });

    test('should start and end grouping mode', () => {
      render(
        <TestWrapper>
          <TestWindowGroupingComponent />
        </TestWrapper>,
      );

      // Start grouping
      fireEvent.click(screen.getByTestId('start-grouping'));
      expect(screen.getByTestId('grouping-status')).toHaveTextContent(
        'Grouping Active',
      );

      // End grouping
      fireEvent.click(screen.getByTestId('end-grouping'));
      expect(screen.getByTestId('grouping-status')).toHaveTextContent(
        'Grouping Inactive',
      );
    });
  });

  describe('WindowGroupManager Component', () => {
    test('should render when visible', () => {
      render(
        <TestWrapper>
          <WindowGroupManager isVisible={true} onClose={jest.fn()} />
        </TestWrapper>,
      );

      expect(screen.getByText('Window Group Manager')).toBeInTheDocument();
      expect(screen.getByText('Start Grouping')).toBeInTheDocument();
    });

    test('should not render when not visible', () => {
      render(
        <TestWrapper>
          <WindowGroupManager isVisible={false} onClose={jest.fn()} />
        </TestWrapper>,
      );

      expect(
        screen.queryByText('Window Group Manager'),
      ).not.toBeInTheDocument();
    });

    test('should show available windows for grouping', () => {
      // Mock state with open apps
      const mockState = {
        openApps: mockApps,
        windowGroups: [],
        tabGroups: [],
      };

      jest.doMock('../src/context/AppContext', () => ({
        useApp: () => ({
          state: mockState,
          dispatch: jest.fn(),
        }),
      }));

      render(
        <TestWrapper>
          <WindowGroupManager isVisible={true} onClose={jest.fn()} />
        </TestWrapper>,
      );

      expect(screen.getByText('Available Windows')).toBeInTheDocument();
    });
  });

  describe('TabManager Component', () => {
    test('should render with no tabs message when no group provided', () => {
      render(
        <TestWrapper>
          <TabManager groupId={null} />
        </TestWrapper>,
      );

      expect(screen.getByText('No tabs open')).toBeInTheDocument();
    });

    test('should render with no tabs message when group not found', () => {
      render(
        <TestWrapper>
          <TabManager groupId="non-existent-group" />
        </TestWrapper>,
      );

      expect(screen.getByText('No tabs open')).toBeInTheDocument();
    });
  });

  describe('Window Grouping Integration', () => {
    test('should render WindowGroupManager without errors', () => {
      render(
        <TestWrapper>
          <WindowGroupManager isVisible={true} onClose={jest.fn()} />
        </TestWrapper>,
      );

      expect(screen.getByText('Window Group Manager')).toBeInTheDocument();
    });

    test('should handle grouping mode toggle', () => {
      render(
        <TestWrapper>
          <TestWindowGroupingComponent />
        </TestWrapper>,
      );

      const startButton = screen.getByTestId('start-grouping');
      const endButton = screen.getByTestId('end-grouping');

      expect(startButton).toBeInTheDocument();
      expect(endButton).toBeInTheDocument();

      // Test that buttons are clickable
      expect(() => fireEvent.click(startButton)).not.toThrow();
      expect(() => fireEvent.click(endButton)).not.toThrow();
    });

    test('should handle create group button state', () => {
      render(
        <TestWrapper>
          <TestWindowGroupingComponent />
        </TestWrapper>,
      );

      const createButton = screen.getByTestId('create-group');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toBeDisabled(); // Should be disabled when no windows selected
    });
  });
});
