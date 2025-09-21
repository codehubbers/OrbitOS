import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { themes } from '@/system/themes';

export default function CalculatorApp() {
  const { state } = useApp();
  const currentTheme = themes[state.theme];
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const inputNum = (num) => {
    if (waiting) {
      setDisplay(String(num));
      setWaiting(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOp = (nextOp) => {
    const val = parseFloat(display);
    if (prev === null) {
      setPrev(val);
    } else if (op) {
      const result = calc(prev, val, op);
      setDisplay(String(result));
      setPrev(result);
    }
    setWaiting(true);
    setOp(nextOp);
  };

  const calc = (a, b, operation) => {
    switch (operation) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return a / b;
      default:
        return b;
    }
  };

  const equals = () => {
    const val = parseFloat(display);
    if (prev !== null && op) {
      const result = calc(prev, val, op);
      setDisplay(String(result));
      setPrev(null);
      setOp(null);
      setWaiting(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setWaiting(false);
  };

  return (
    <div
      className={`h-full p-4 ${state.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
    >
      <div
        className={`max-w-xs mx-auto ${currentTheme.window} rounded-lg shadow-lg p-4`}
      >
        <div
          className={`mb-4 p-4 ${state.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900'} ${currentTheme.text} text-right text-2xl font-mono rounded`}
        >
          {display}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={clear}
            className="col-span-2 h-12 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear
          </button>
          <button
            onClick={() => inputOp('/')}
            className="h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ÷
          </button>
          <button
            onClick={() => inputOp('*')}
            className="h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ×
          </button>

          <button
            onClick={() => inputNum(7)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            7
          </button>
          <button
            onClick={() => inputNum(8)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            8
          </button>
          <button
            onClick={() => inputNum(9)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            9
          </button>
          <button
            onClick={() => inputOp('-')}
            className="h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            -
          </button>

          <button
            onClick={() => inputNum(4)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            4
          </button>
          <button
            onClick={() => inputNum(5)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            5
          </button>
          <button
            onClick={() => inputNum(6)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            6
          </button>
          <button
            onClick={() => inputOp('+')}
            className="h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            +
          </button>

          <button
            onClick={() => inputNum(1)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            1
          </button>
          <button
            onClick={() => inputNum(2)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            2
          </button>
          <button
            onClick={() => inputNum(3)}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            3
          </button>
          <button
            onClick={equals}
            className="row-span-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            =
          </button>

          <button
            onClick={() => inputNum(0)}
            className="col-span-2 h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            0
          </button>
          <button
            onClick={() => inputNum('.')}
            className="h-12 bg-gray-200 rounded hover:bg-gray-300"
          >
            .
          </button>
        </div>
      </div>
    </div>
  );
}
