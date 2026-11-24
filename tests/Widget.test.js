import { render, screen } from '@testing-library/react';
import { act } from 'react';
import Widget from '@/components/Widget';

describe('Widget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides desktop positioning, sizing, persistence, and timed refresh', () => {
    const onRefresh = jest.fn();
    render(
      <Widget
        id="test"
        title="Test"
        icon="T"
        defaultPosition={{ x: 40, y: 50 }}
        defaultSize={{ width: 300, height: 400 }}
        refreshInterval={900000}
        onRefresh={onRefresh}
      >
        Widget content
      </Widget>,
    );

    const widget = screen.getByRole('region', { name: 'Test widget' });
    expect(widget).toHaveStyle({ left: '40px', top: '50px', width: '300px' });
    expect(screen.getByText('Widget content')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('orbitos-widget-test'))).toEqual({
      position: { x: 40, y: 50 },
      size: { width: 300, height: 400 },
    });

    act(() => {
      jest.advanceTimersByTime(900000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
