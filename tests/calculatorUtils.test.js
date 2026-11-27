import {
  CALCULATOR_HISTORY_KEY,
  MAX_CALCULATOR_HISTORY,
  evaluateExpression,
  formatCalculatorResult,
  loadCalculatorHistory,
  saveCalculatorHistory,
} from '../src/lib/calculatorUtils';

describe('evaluateExpression', () => {
  test('evaluates addition and subtraction', () => {
    expect(evaluateExpression('18 + 7 - 5')).toBe(20);
  });

  test('respects multiplication and division precedence', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);

    expect(evaluateExpression('24 / 3 * 2')).toBe(16);
  });

  test('supports decimal numbers', () => {
    expect(evaluateExpression('0.1 + 0.2')).toBeCloseTo(0.3);
  });

  test('supports unary positive and negative operators', () => {
    expect(evaluateExpression('-8 + +3')).toBe(-5);

    expect(evaluateExpression('5 * -2')).toBe(-10);
  });

  test('supports postfix percentages', () => {
    expect(evaluateExpression('50%')).toBe(0.5);

    expect(evaluateExpression('200 * 10%')).toBe(20);
  });

  test('accepts display operator symbols', () => {
    expect(evaluateExpression('8 × 3 − 4 ÷ 2')).toBe(22);
  });

  test('throws an error when dividing by zero', () => {
    expect(() => evaluateExpression('10 / 0')).toThrow('Cannot divide by zero');
  });

  test.each(['', '1 +', '* 2', '1..2', '1 + abc', '1; alert(1)', '1 2'])(
    'rejects invalid expression: %s',
    (expression) => {
      expect(() => evaluateExpression(expression)).toThrow(
        'Invalid expression',
      );
    },
  );

  test('formats floating-point results', () => {
    expect(formatCalculatorResult(0.1 + 0.2)).toBe('0.3');

    expect(formatCalculatorResult(-0)).toBe('0');
  });
});

describe('calculator history storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('saves and restores history from localStorage', () => {
    const history = [
      {
        expression: '2 + 3',
        result: '5',
        timestamp: 1700000000000,
      },
      {
        expression: '9 / 3',
        result: '3',
        timestamp: 1700000001000,
      },
    ];

    saveCalculatorHistory(history);

    expect(window.localStorage.getItem(CALCULATOR_HISTORY_KEY)).not.toBeNull();

    expect(loadCalculatorHistory()).toEqual(history);
  });

  test('limits history to 50 entries', () => {
    const history = Array.from(
      { length: MAX_CALCULATOR_HISTORY + 5 },
      (_, index) => ({
        expression: `${index} + 1`,
        result: String(index + 1),
        timestamp: 1700000000000 + index,
      }),
    );

    saveCalculatorHistory(history);

    expect(loadCalculatorHistory()).toHaveLength(MAX_CALCULATOR_HISTORY);
  });

  test('returns empty history for invalid JSON', () => {
    window.localStorage.setItem(CALCULATOR_HISTORY_KEY, '{not valid json');

    expect(loadCalculatorHistory()).toEqual([]);
  });

  test('ignores malformed history entries', () => {
    window.localStorage.setItem(
      CALCULATOR_HISTORY_KEY,
      JSON.stringify([
        {
          expression: '1 + 1',
          result: '2',
          timestamp: 1700000000000,
        },
        {
          expression: 42,
          result: 'invalid',
          timestamp: 'yesterday',
        },
      ]),
    );

    expect(loadCalculatorHistory()).toEqual([
      {
        expression: '1 + 1',
        result: '2',
        timestamp: 1700000000000,
      },
    ]);
  });
});
