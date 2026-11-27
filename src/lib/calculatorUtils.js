export const CALCULATOR_HISTORY_KEY = 'orbitos.calculator.history.v1';
export const MAX_CALCULATOR_HISTORY = 50;

const INVALID_EXPRESSION_MESSAGE = 'Invalid expression';

function tokenize(expression) {
  const normalized = String(expression)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const character = normalized[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      let numberText = '';
      let decimalCount = 0;
      let digitCount = 0;

      while (index < normalized.length && /[0-9.]/.test(normalized[index])) {
        const currentCharacter = normalized[index];

        if (currentCharacter === '.') {
          decimalCount += 1;

          if (decimalCount > 1) {
            throw new Error(INVALID_EXPRESSION_MESSAGE);
          }
        } else {
          digitCount += 1;
        }

        numberText += currentCharacter;
        index += 1;
      }

      if (digitCount === 0) {
        throw new Error(INVALID_EXPRESSION_MESSAGE);
      }

      const value = Number(numberText);

      if (!Number.isFinite(value)) {
        throw new Error(INVALID_EXPRESSION_MESSAGE);
      }

      tokens.push({
        type: 'number',
        value,
      });

      continue;
    }

    if ('+-*/%'.includes(character)) {
      tokens.push({
        type: 'operator',
        value: character,
      });

      index += 1;
      continue;
    }

    throw new Error(INVALID_EXPRESSION_MESSAGE);
  }

  return tokens;
}

/**
 * Evaluates arithmetic expressions without eval().
 *
 * Supported operators:
 * +, -, *, /, unary +/-, and postfix percentage (%).
 *
 * Multiplication and division have higher precedence
 * than addition and subtraction.
 */
export function evaluateExpression(expression) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw new Error(INVALID_EXPRESSION_MESSAGE);
  }

  const tokens = tokenize(expression);

  if (tokens.length === 0) {
    throw new Error(INVALID_EXPRESSION_MESSAGE);
  }

  let position = 0;

  const readNumber = () => {
    const token = tokens[position];

    if (!token || token.type !== 'number') {
      throw new Error(INVALID_EXPRESSION_MESSAGE);
    }

    position += 1;

    let value = token.value;

    while (tokens[position]?.value === '%') {
      value /= 100;
      position += 1;
    }

    return value;
  };

  const readUnary = () => {
    const token = tokens[position];

    if (
      token?.type === 'operator' &&
      (token.value === '+' || token.value === '-')
    ) {
      position += 1;

      const value = readUnary();

      return token.value === '-' ? -value : value;
    }

    return readNumber();
  };

  const readTerm = () => {
    let value = readUnary();

    while (position < tokens.length) {
      const operator = tokens[position]?.value;

      if (operator !== '*' && operator !== '/') {
        break;
      }

      position += 1;

      const right = readUnary();

      if (operator === '/') {
        if (right === 0) {
          throw new RangeError('Cannot divide by zero');
        }

        value /= right;
      } else {
        value *= right;
      }

      if (!Number.isFinite(value)) {
        throw new RangeError('Result is out of range');
      }
    }

    return value;
  };

  const readExpression = () => {
    let value = readTerm();

    while (position < tokens.length) {
      const operator = tokens[position]?.value;

      if (operator !== '+' && operator !== '-') {
        break;
      }

      position += 1;

      const right = readTerm();

      value = operator === '+' ? value + right : value - right;

      if (!Number.isFinite(value)) {
        throw new RangeError('Result is out of range');
      }
    }

    return value;
  };

  const result = readExpression();

  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error(INVALID_EXPRESSION_MESSAGE);
  }

  return result;
}

export function formatCalculatorResult(value) {
  if (!Number.isFinite(value)) {
    throw new RangeError('Result is out of range');
  }

  const roundedValue = Number(value.toPrecision(12));

  return Object.is(roundedValue, -0) ? '0' : String(roundedValue);
}

function isValidHistoryEntry(entry) {
  const validResult =
    typeof entry?.result === 'string' ||
    (typeof entry?.result === 'number' && Number.isFinite(entry.result));

  return (
    entry &&
    typeof entry.expression === 'string' &&
    validResult &&
    Number.isFinite(entry.timestamp)
  );
}

export function loadCalculatorHistory() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(CALCULATOR_HISTORY_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isValidHistoryEntry)
      .map((entry) => ({
        expression: entry.expression,
        result: String(entry.result),
        timestamp: entry.timestamp,
      }))
      .slice(0, MAX_CALCULATOR_HISTORY);
  } catch {
    return [];
  }
}

export function saveCalculatorHistory(history) {
  if (typeof window === 'undefined' || !Array.isArray(history)) {
    return;
  }

  try {
    const safeHistory = history
      .filter(isValidHistoryEntry)
      .slice(0, MAX_CALCULATOR_HISTORY);

    window.localStorage.setItem(
      CALCULATOR_HISTORY_KEY,
      JSON.stringify(safeHistory),
    );
  } catch {
    // Storage may be unavailable in restricted environments.
  }
}
