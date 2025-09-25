import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(0);
  const { theme } = useTheme();

  const handleClear = () => setExpression('');
  const handleAllClear = () => { setExpression(''); setMemory(0); };
  const handleBackspace = () => setExpression(prev => prev.slice(0, -1));

  const safeEvaluate = (expr) => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
      if (!sanitized) throw new Error('Invalid');
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (!isFinite(result)) throw new Error('Invalid');
      return result;
    } catch { throw new Error('Error'); }
  };

  const handleEvaluate = () => {
    if (!expression.trim()) return;
    try {
      const result = safeEvaluate(expression);
      setExpression(String(result));
    } catch {
      setExpression('Error');
      setTimeout(() => setExpression(''), 1500);
    }
  };

  const handleMemory = (action) => {
    const current = parseFloat(expression) || 0;
    switch (action) {
      case 'MC': setMemory(0); break;
      case 'MR': setExpression(String(memory)); break;
      case 'M+': setMemory(prev => prev + current); break;
      case 'M-': setMemory(prev => prev - current); break;
    }
  };

  const handleButtonClick = (btn) => {
    if (expression === 'Error') setExpression('');
    if (btn === '=') handleEvaluate();
    else if (['+', '-', '*', '/'].includes(btn)) {
      if (expression && !['+', '-', '*', '/'].includes(expression.slice(-1))) {
        setExpression(prev => prev + btn);
      } else if (!expression && btn === '-') {
        setExpression(btn);
      }
    } else if (btn === '.') {
      const lastNumber = expression.split(/[+\-*/]/).pop();
      if (!lastNumber.includes('.')) setExpression(prev => prev + btn);
    } else {
      setExpression(prev => prev + btn);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      if (e.key >= '0' && e.key <= '9') handleButtonClick(e.key);
      else if ('+-*/.'.includes(e.key)) handleButtonClick(e.key);
      else if (e.key === 'Enter' || e.key === '=') handleEvaluate();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
      else if (e.key.toLowerCase() === 'c') handleAllClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  return (
    <div className={theme.app.bg}>
      <div className="bg-white dark:bg-gray-700 rounded-lg border p-1 mb-1">
        <div className="text-right text-2xl font-mono text-gray-800 dark:text-white">
          {expression || '0'}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {['MC', 'MR', 'M+', 'M-'].map(btn => (
          <button key={btn} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm"
            onClick={() => handleMemory(btn)}>{btn}</button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button className={theme.app.button} onClick={handleAllClear}>AC</button>
        <button className={theme.app.button} onClick={handleClear}>CE</button>
        <button className={theme.app.button} onClick={handleBackspace}>⌫</button>
        <button className={theme.app.button} onClick={() => handleButtonClick('/')}>÷</button>

        {['7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map((btn, i) => (
          <button key={btn} className={theme.app.button}
            onClick={() => btn === '=' ? handleEvaluate() : handleButtonClick(btn)}
            style={btn === '0' ? {gridColumn: 'span 2'} : {}}>
            {btn === '*' ? '×' : btn}
          </button>
        ))}
      </div>
    </div>
  );
}
