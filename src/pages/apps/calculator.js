import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  evaluateExpression,
  formatCalculatorResult,
  loadCalculatorHistory,
  MAX_CALCULATOR_HISTORY,
  saveCalculatorHistory,
} from './calculatorUtils';

const MEMORY_ACTIONS = ['MC', 'MR', 'M+', 'M−'];

function formatExpression(expression) {
  return expression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
}

function formatHistoryTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isEditableTarget(target) {
  return Boolean(
    target?.closest?.(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

export default function Calculator() {
  const { state } = useApp();
  const { theme } = useTheme();

  const calculatorTheme = theme.calculator;
  const appTheme = theme.app;

  const [expression, setExpression] = useState('');
  const [lastExpression, setLastExpression] = useState('');
  const [isResultDisplayed, setIsResultDisplayed] = useState(false);
  const [error, setError] = useState('');
  const [memory, setMemory] = useState(0);

  const [history, setHistory] = useState(() => loadCalculatorHistory());

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);

  const keyboardActionsRef = useRef(null);
  const animationTimerRef = useRef(null);

  // Persist calculation history.
  useEffect(() => {
    saveCalculatorHistory(history);
  }, [history]);

  // Clean up animation timers.
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const triggerButtonAnimation = (key) => {
    setPressedKey(key);

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    animationTimerRef.current = setTimeout(() => {
      setPressedKey(null);
      animationTimerRef.current = null;
    }, 120);
  };

  // Append a numeric digit.
  const appendDigit = (digit) => {
    setExpression((currentExpression) => {
      const current = isResultDisplayed ? '' : currentExpression;

      if (current === '0') {
        return digit === '0' ? '0' : digit;
      }

      if (current === '-0') {
        return digit === '0' ? '-0' : `-${digit}`;
      }

      return `${current}${digit}`;
    });

    setIsResultDisplayed(false);
    setError('');
  };

  // Append a decimal point.
  const appendDecimal = () => {
    setExpression((currentExpression) => {
      const current = isResultDisplayed ? '' : currentExpression;

      const lastNumber = current.match(/[0-9.]+$/)?.[0] || '';

      if (lastNumber.includes('.')) {
        return current;
      }

      if (!current || /[+\-*/]$/.test(current)) {
        return `${current}0.`;
      }

      return `${current}.`;
    });

    setIsResultDisplayed(false);
    setError('');
  };

  // Append or replace an arithmetic operator.
  const appendOperator = (operator) => {
    setExpression((currentExpression) => {
      const current = currentExpression;

      if (!current) {
        return operator === '-' ? '-' : '';
      }

      if (/[+\-*/]$/.test(current)) {
        const hasUnaryMinus =
          current.endsWith('-') &&
          current.length > 1 &&
          /[+\-*/]/.test(current[current.length - 2]);

        if (hasUnaryMinus) {
          if (operator === '-') {
            return current;
          }

          return `${current.slice(0, -2)}${operator}`;
        }

        if (operator === '-' && !current.endsWith('-')) {
          return `${current}-`;
        }

        return `${current.slice(0, -1)}${operator}`;
      }

      return `${current}${operator}`;
    });

    setIsResultDisplayed(false);
    setError('');
  };

  // Append percentage.
  const appendPercent = () => {
    setExpression((currentExpression) => {
      const current = currentExpression;

      if (!/[0-9.]$/.test(current) || current.endsWith('%')) {
        return current;
      }

      return `${current}%`;
    });

    setIsResultDisplayed(false);
    setError('');
  };

  // Remove the last character.
  const deleteLastCharacter = () => {
    setExpression((currentExpression) => currentExpression.slice(0, -1));

    setIsResultDisplayed(false);
    setError('');
  };

  // Reset the current calculation.
  const clearAll = () => {
    setExpression('');
    setLastExpression('');
    setIsResultDisplayed(false);
    setError('');
  };

  // Calculate the expression and save the result.
  const evaluateCurrentExpression = () => {
    const sourceExpression = expression.trim();

    if (!sourceExpression) {
      return;
    }

    try {
      const numericResult = evaluateExpression(sourceExpression);

      const formattedResult = formatCalculatorResult(numericResult);

      const historyEntry = {
        expression: sourceExpression,
        result: formattedResult,
        timestamp: Date.now(),
      };

      setHistory((currentHistory) =>
        [historyEntry, ...currentHistory].slice(0, MAX_CALCULATOR_HISTORY),
      );

      setLastExpression(sourceExpression);
      setExpression(formattedResult);
      setIsResultDisplayed(true);
      setError('');
    } catch (calculationError) {
      setError(
        calculationError.message || 'Unable to calculate this expression',
      );

      setIsResultDisplayed(false);
    }
  };

  // Calculator memory operations.
  const handleMemory = (action) => {
    let currentValue = 0;

    try {
      currentValue = expression ? evaluateExpression(expression) : 0;
    } catch {
      currentValue = 0;
    }

    switch (action) {
      case 'MC':
        setMemory(0);
        break;

      case 'MR':
        setExpression(formatCalculatorResult(memory));
        setIsResultDisplayed(false);
        setError('');
        break;

      case 'M+':
        setMemory((currentMemory) => currentMemory + currentValue);
        break;

      case 'M-':
        setMemory((currentMemory) => currentMemory - currentValue);
        break;

      default:
        break;
    }
  };

  // Restore a previous calculation.
  const restoreHistoryEntry = (entry) => {
    setExpression(entry.result);
    setLastExpression(entry.expression);
    setIsResultDisplayed(true);
    setError('');
  };

  // Keep the latest actions accessible to the keyboard listener.
  keyboardActionsRef.current = {
    appendDigit,
    appendDecimal,
    appendOperator,
    appendPercent,
    deleteLastCharacter,
    clearAll,
    evaluateCurrentExpression,
    triggerButtonAnimation,
  };

  // Register keyboard shortcuts only when Calculator is active.
  useEffect(() => {
    if (state.activeApp !== 'calculator') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const actions = keyboardActionsRef.current;
      const { key } = event;

      let action;
      let animationKey;

      if (/^[0-9]$/.test(key)) {
        action = () => actions.appendDigit(key);
        animationKey = key;
      } else if (key === '.') {
        action = actions.appendDecimal;
        animationKey = '.';
      } else if (['+', '-', '*', '/'].includes(key)) {
        action = () => actions.appendOperator(key);
        animationKey = key;
      } else if (key === 'Enter' || key === '=') {
        action = actions.evaluateCurrentExpression;
        animationKey = '=';
      } else if (key === 'Backspace') {
        action = actions.deleteLastCharacter;
        animationKey = 'Backspace';
      } else if (key === 'Escape') {
        action = actions.clearAll;
        animationKey = 'Escape';
      } else if (key === '%') {
        action = actions.appendPercent;
        animationKey = '%';
      } else {
        return;
      }

      event.preventDefault();

      actions.triggerButtonAnimation(animationKey);

      action();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.activeApp]);

  // Calculate a live preview without saving it to history.
  const previewResult = (() => {
    if (!expression || isResultDisplayed) {
      return '';
    }

    try {
      return formatCalculatorResult(evaluateExpression(expression));
    } catch {
      return '';
    }
  })();

  const displayValue = error
    ? 'Error'
    : isResultDisplayed
      ? expression || '0'
      : previewResult || formatExpression(expression) || '0';

  const buttonStyles = {
    number: calculatorTheme.numberButton,
    operator: calculatorTheme.operatorButton,
    function: calculatorTheme.functionButton,
    equals: calculatorTheme.equalsButton,
  };

  // Calculator keypad configuration.
  const keypadButtons = [
    {
      id: 'clear',
      label: 'C',
      key: 'Escape',
      tone: 'function',
      action: clearAll,
    },
    {
      id: 'backspace',
      label: '⌫',
      key: 'Backspace',
      tone: 'function',
      action: deleteLastCharacter,
      ariaLabel: 'Backspace',
    },
    {
      id: 'percent',
      label: '%',
      key: '%',
      tone: 'function',
      action: appendPercent,
    },
    {
      id: 'divide',
      label: '÷',
      key: '/',
      tone: 'operator',
      action: () => appendOperator('/'),
    },

    ...[7, 8, 9].map((digit) => ({
      id: `digit-${digit}`,
      label: String(digit),
      key: String(digit),
      tone: 'number',
      action: () => appendDigit(String(digit)),
    })),

    {
      id: 'multiply',
      label: '×',
      key: '*',
      tone: 'operator',
      action: () => appendOperator('*'),
    },

    ...[4, 5, 6].map((digit) => ({
      id: `digit-${digit}`,
      label: String(digit),
      key: String(digit),
      tone: 'number',
      action: () => appendDigit(String(digit)),
    })),

    {
      id: 'subtract',
      label: '−',
      key: '-',
      tone: 'operator',
      action: () => appendOperator('-'),
    },

    ...[1, 2, 3].map((digit) => ({
      id: `digit-${digit}`,
      label: String(digit),
      key: String(digit),
      tone: 'number',
      action: () => appendDigit(String(digit)),
    })),

    {
      id: 'add',
      label: '+',
      key: '+',
      tone: 'operator',
      action: () => appendOperator('+'),
    },

    {
      id: 'digit-0',
      label: '0',
      key: '0',
      tone: 'number',
      action: () => appendDigit('0'),
      wide: true,
    },

    {
      id: 'decimal',
      label: '.',
      key: '.',
      tone: 'number',
      action: appendDecimal,
    },

    {
      id: 'equals',
      label: '=',
      key: '=',
      tone: 'equals',
      action: evaluateCurrentExpression,
    },
  ];

  return (
    <div
      className={`${calculatorTheme.bg} flex h-full min-h-0 w-full gap-2 overflow-hidden p-2 ${appTheme.text}`}
    >
      <section className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Calculator heading */}
        <header className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`${calculatorTheme.displaySubtext} text-[10px] font-semibold uppercase tracking-[0.2em]`}
            >
              OrbitOS / Utilities
            </p>

            <h2
              className={`${appTheme.text} text-lg font-semibold tracking-tight`}
            >
              Calculator
            </h2>
          </div>

          <button
            type="button"
            aria-expanded={isHistoryOpen}
            aria-controls="calculator-history-panel"
            onClick={() => setIsHistoryOpen((isOpen) => !isOpen)}
            className={`${calculatorTheme.historyToggle} inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors`}
          >
            <span aria-hidden="true">◷</span>
            History
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
              {history.length}
            </span>
          </button>
        </header>

        {/* Calculation display */}
        <div
          className={`${calculatorTheme.display} flex min-h-[88px] shrink-0 flex-col justify-between rounded-2xl p-3 shadow-xl`}
        >
          <div
            className={`${calculatorTheme.displaySubtext} min-h-5 truncate text-right text-xs`}
          >
            {isResultDisplayed
              ? lastExpression
                ? `${formatExpression(lastExpression)} =`
                : 'Result'
              : formatExpression(expression) || 'Ready for a calculation'}
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            className={`${calculatorTheme.displayText} break-all text-right font-mono text-3xl font-light tracking-tight sm:text-4xl`}
          >
            {displayValue}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-1 text-right text-xs font-medium text-red-500"
            >
              {error}
            </p>
          )}
        </div>

        {/* Memory buttons */}
        <div className="grid shrink-0 grid-cols-4 gap-1.5">
          {MEMORY_ACTIONS.map((action) => (
            <motion.button
              key={action}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleMemory(action.replace('−', '-'))}
              className={`${calculatorTheme.memoryButton} min-h-7 rounded-xl px-1 py-1 text-[11px] font-semibold transition-colors`}
              aria-label={
                action === 'MC'
                  ? 'Memory clear'
                  : action === 'MR'
                    ? 'Memory recall'
                    : action === 'M+'
                      ? 'Memory add'
                      : 'Memory subtract'
              }
            >
              {action}
            </motion.button>
          ))}
        </div>

        {/* Calculator keypad */}
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-1.5">
          {keypadButtons.map((button) => (
            <motion.button
              key={button.id}
              type="button"
              aria-label={button.ariaLabel || button.label}
              whileHover={{ y: -1, scale: 1.015 }}
              whileTap={{ scale: 0.96 }}
              animate={
                pressedKey === button.key ? { scale: 0.96 } : { scale: 1 }
              }
              transition={{ duration: 0.12 }}
              onClick={button.action}
              className={`${buttonStyles[button.tone]} ${
                button.wide ? 'col-span-2' : ''
              } min-h-0 rounded-xl text-lg font-semibold transition-colors sm:text-xl`}
            >
              {button.label}
            </motion.button>
          ))}
        </div>

        {/* Keyboard shortcuts hint */}
        <p
          className={`${calculatorTheme.displaySubtext} shrink-0 text-center text-[10px]`}
        >
          Keyboard: 0–9 · + − × ÷ · Enter · Backspace · Esc
        </p>
      </section>

      {/* Calculation history panel */}
      <AnimatePresence initial={false}>
        {isHistoryOpen && (
          <motion.aside
            id="calculator-history-panel"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 184 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`${calculatorTheme.historyPanel} flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl p-2`}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <div>
                <h3
                  className={`${calculatorTheme.historyTitle} text-sm font-semibold`}
                >
                  History
                </h3>

                <p className={`${calculatorTheme.historyMuted} text-[10px]`}>
                  Recent calculations
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
                className={`${calculatorTheme.historyAction} rounded-lg px-2 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Clear
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
              {history.length === 0 ? (
                <p
                  className={`${calculatorTheme.historyMuted} m-auto px-2 text-center text-xs leading-5`}
                >
                  Your calculations will appear here.
                </p>
              ) : (
                history.map((entry, index) => (
                  <button
                    key={`${entry.timestamp}-${index}`}
                    type="button"
                    onClick={() => restoreHistoryEntry(entry)}
                    className={`${calculatorTheme.historyItem} group w-full rounded-xl p-2 text-left transition-colors`}
                    title={`Restore ${entry.expression}`}
                  >
                    <span
                      className={`${calculatorTheme.historyMuted} ${calculatorTheme.historyItemHoverText} block truncate text-[10px]`}
                    >
                      {formatExpression(entry.expression)}
                    </span>

                    <span
                      className={`${calculatorTheme.historyResult} ${calculatorTheme.historyItemHoverText} mt-1 block truncate text-right text-sm font-semibold`}
                    >
                      {entry.result}
                    </span>

                    <span
                      className={`${calculatorTheme.historyMuted} ${calculatorTheme.historyItemHoverText} mt-1 block text-right text-[9px]`}
                    >
                      {formatHistoryTime(entry.timestamp)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
