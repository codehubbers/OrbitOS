import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(0);
  const [lastResult, setLastResult] = useState('');
  const { theme } = useTheme();

  const handleClear = () => {
    setExpression('');
    setLastResult('');
  };

  const handleAllClear = () => {
    setExpression('');
    setLastResult('');
    setMemory(0);
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const safeEvaluate = (expr) => {
    try {
      // Replace any potential security risks and validate expression
      const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
      if (!sanitized) {
        throw new Error('Invalid expression');
      }

      console.log(sanitized);
      // Use Function constructor for safe evaluation
      const result = Function(`"use strict"; return (${sanitized})`)();

      if (!isFinite(result)) {
        throw new Error('Invalid result');
      }

      return result;
    } catch (error) {
      throw new Error('Error');
    }
  };

  const handleEvaluate = () => {
    if (!expression.trim()) return;

    try {
      const result = safeEvaluate(expression);
      setLastResult(expression + ' = ' + result);
      setExpression(String(result));
    } catch (error) {
      setExpression('Error');
      setTimeout(() => setExpression(''), 1500);
    }
  };

  const handleMemory = (action) => {
    const current = parseFloat(expression) || 0;

    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setExpression(String(memory));
        break;
      case 'M+':
        setMemory((prev) => prev + current);
        break;
      case 'M-':
        setMemory((prev) => prev - current);
        break;
      default:
        break;
    }
  };

  const handleButtonClick = (btn) => {
    if (expression === 'Error') {
      setExpression('');
    }

    if (btn === '=') {
      handleEvaluate();
    } else if (['+', '-', '*', '/'].includes(btn)) {
      // Prevent multiple operators in a row
      if (expression && !['+', '-', '*', '/'].includes(expression.slice(-1))) {
        setExpression((prev) => prev + btn);
      } else if (!expression && btn === '-') {
        // Allow negative numbers
        setExpression(btn);
      }
    } else if (btn === '.') {
      // Prevent multiple decimals in the same number
      const lastNumber = expression.split(/[+\-*/]/).pop();
      if (!lastNumber.includes('.')) {
        setExpression((prev) => prev + btn);
      }
    } else {
      setExpression((prev) => prev + btn);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();

      if (e.key >= '0' && e.key <= '9') {
        handleButtonClick(e.key);
      } else if ('+-*/.'.includes(e.key)) {
        handleButtonClick(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        handleAllClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  const numberButtons = [
    '7',
    '8',
    '9',
    '4',
    '5',
    '6',
    '1',
    '2',
    '3',
    '0',
    '.',
    '=',
  ];

  const operatorButtons = ['/', '*', '-', '+'];

  return (
    <div className={`${theme.app.bg}`}>
      <div className="">
        {/* Main display */}
        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-1 mb-1">
          <div className="text-right text-2xl font-mono text-gray-800 dark:text-white overflow-x-auto">
            {expression || '0'}
          </div>
        </div>
      </div>

      {/* Memory Buttons */}
      <div className="grid grid-cols-5 text-center gap-2 mb-3">
        {['MC', 'MR', 'M+', 'M-'].map((btn) => (
          <button
            key={btn}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
            onClick={() => handleMemory(btn)}
            title={
              btn === 'MC'
                ? 'Memory Clear'
                : btn === 'MR'
                  ? 'Memory Recall'
                  : btn === 'M+'
                    ? 'Memory Add'
                    : btn === 'M-'
                      ? 'Memory Subtract'
                      : 'Memory Store'
            }
          >
            {btn}
          </button>
        ))}
        {/* Memory indicator */}
        {memory !== 0 && (
          <div className="text-xs text-center place-content-center h-full text-blue-600 dark:text-blue-400 mb-2">
            Memory: {memory}
          </div>
        )}
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Clear buttons */}
        <button
          className={`${theme.app.button}`}
          onClick={handleAllClear}
          title="All Clear (Escape or C)"
        >
          AC
        </button>
        <button
          className={`${theme.app.button}`}
          onClick={handleClear}
          title="Clear Entry"
        >
          CE
        </button>
        <button
          className={`${theme.app.button}`}
          onClick={handleBackspace}
          title="Backspace"
        >
          ⌫
        </button>

        {/* Operators column */}
        <button
          className={`${theme.app.button}`}
          onClick={() => handleButtonClick('/')}
        >
          ÷
        </button>

        {/* Number grid with operators */}
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="contents">
            {/* Numbers for this row */}
            {numberButtons.slice(row * 3, row * 3 + 3).map((btn) => (
              <button
                key={btn}
                className={`rounded-lg py-3 font-semibold text-lg transition-colors ${theme.app.button}`}
                onClick={() =>
                  btn === '=' ? handleEvaluate() : handleButtonClick(btn)
                }
              >
                {btn}
              </button>
            ))}

            {/* Operator for this row */}
            {row < 3 && operatorButtons[row + 1] && (
              <button
                className={`${theme.app.button}`}
                onClick={() => handleButtonClick(operatorButtons[row + 1])}
              >
                {operatorButtons[row + 1] === '*'
                  ? '×'
                  : operatorButtons[row + 1]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
