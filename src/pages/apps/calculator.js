import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [operation, setOperation] = useState('');
  const [previousValue, setPreviousValue] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [lastAction, setLastAction] = useState('');
  const [pressedKey, setPressedKey] = useState(null);
  const { theme } = useTheme();

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
    setLastAction(`${num}`);
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setOperation('');
    setPreviousValue(null);
    setWaitingForOperand(false);
    setLastAction('Clear');
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      setLastAction(
        `${currentValue} ${getOperationSymbol(operation)} ${inputValue} =`,
      );
    }

    if (nextOperation === '=') {
      setWaitingForOperand(false);
      setOperation('');
      setPreviousValue(null);
    } else {
      setWaitingForOperand(true);
      setOperation(nextOperation);
    }
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const getOperationSymbol = (op) => {
    switch (op) {
      case '+':
        return '+';
      case '-':
        return '−';
      case '*':
        return '×';
      case '/':
        return '÷';
      default:
        return op;
    }
  };

  const handleMemory = (action) => {
    const current = parseFloat(display) || 0;
    switch (action) {
      case 'MC':
        setMemory(0);
        setLastAction('Memory cleared');
        break;
      case 'MR':
        setDisplay(String(memory));
        setWaitingForOperand(false);
        setLastAction('Memory recalled');
        break;
      case 'M+':
        setMemory((prev) => prev + current);
        setLastAction(`Memory + ${current}`);
        break;
      case 'M-':
        setMemory((prev) => prev - current);
        setLastAction(`Memory − ${current}`);
        break;
    }
  };

  const getButtonVariants = (buttonKey) => ({
    hover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.15, ease: 'easeOut' },
    },
    tap: {
      scale: 0.95,
      y: 0,
      transition: { duration: 0.1 },
    },
    pressed: {
      scale: 0.95,
      y: 0,
      transition: { duration: 0.1 },
    },
  });

  const triggerButtonAnimation = (key) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 150);
  };

  const displayVariants = {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();

      if (e.key >= '0' && e.key <= '9') {
        triggerButtonAnimation(e.key);
        inputNumber(parseInt(e.key));
      } else if (e.key === '.') {
        triggerButtonAnimation('.');
        inputDecimal();
      } else if (e.key === '+') {
        triggerButtonAnimation('+');
        performOperation('+');
      } else if (e.key === '-') {
        triggerButtonAnimation('-');
        performOperation('-');
      } else if (e.key === '*') {
        triggerButtonAnimation('*');
        performOperation('*');
      } else if (e.key === '/') {
        triggerButtonAnimation('/');
        performOperation('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        triggerButtonAnimation('=');
        performOperation('=');
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        triggerButtonAnimation('C');
        clear();
      } else if (e.key === 'Backspace') {
        triggerButtonAnimation('⌫');
        setDisplay(display.slice(0, -1) || '0');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, waitingForOperand, operation, previousValue]);

  return (
    <div className={`${theme.calculator.bg} p-6 h-full flex flex-col`}>
      {/* Display */}
      <div className={`${theme.calculator.display} rounded-2xl p-6 mb-6`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={lastAction}
            className={`text-right text-sm ${theme.calculator.displaySubtext} h-5 mb-2`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {lastAction}
          </motion.div>
        </AnimatePresence>

        <motion.div
          variants={displayVariants}
          initial="initial"
          animate="animate"
          key={display}
          className={`text-right text-5xl font-light ${theme.calculator.displayText} font-mono tracking-tight`}
        >
          {display}
        </motion.div>
      </div>

      {/* Memory Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {['MC', 'MR', 'M+', 'M−'].map((btn) => (
          <motion.button
            key={btn}
            variants={getButtonVariants(btn)}
            whileHover="hover"
            whileTap="tap"
            className={`${theme.calculator.memoryButton} rounded-xl py-3 text-sm font-semibold transition-all duration-200`}
            onClick={() => handleMemory(btn.replace('−', '-'))}
          >
            {btn}
          </motion.button>
        ))}
      </div>

      {/* Calculator Buttons */}
      <div className="grid grid-cols-4 gap-3 flex-1">
        <motion.button
          variants={getButtonVariants('C')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === 'C' ? 'pressed' : 'initial'}
          className={`${theme.calculator.functionButton} rounded-xl font-semibold text-lg transition-all duration-200`}
          onClick={clear}
        >
          C
        </motion.button>
        <motion.button
          variants={getButtonVariants('⌫')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '⌫' ? 'pressed' : 'initial'}
          className={`${theme.calculator.functionButton} rounded-xl font-semibold text-lg transition-all duration-200`}
          onClick={() => setDisplay(display.slice(0, -1) || '0')}
        >
          ⌫
        </motion.button>
        <motion.button
          variants={getButtonVariants('%')}
          whileHover="hover"
          whileTap="tap"
          className={`${theme.calculator.functionButton} rounded-xl font-semibold text-lg transition-all duration-200`}
        >
          %
        </motion.button>
        <motion.button
          variants={getButtonVariants('/')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '/' ? 'pressed' : 'initial'}
          className={`${theme.calculator.operatorButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={() => performOperation('/')}
        >
          ÷
        </motion.button>

        {[7, 8, 9].map((num) => (
          <motion.button
            key={num}
            variants={getButtonVariants(num.toString())}
            whileHover="hover"
            whileTap="tap"
            animate={pressedKey === num.toString() ? 'pressed' : 'initial'}
            className={`${theme.calculator.numberButton} rounded-xl font-semibold text-xl transition-all duration-200`}
            onClick={() => inputNumber(num)}
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          variants={getButtonVariants('*')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '*' ? 'pressed' : 'initial'}
          className={`${theme.calculator.operatorButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={() => performOperation('*')}
        >
          ×
        </motion.button>

        {[4, 5, 6].map((num) => (
          <motion.button
            key={num}
            variants={getButtonVariants(num.toString())}
            whileHover="hover"
            whileTap="tap"
            animate={pressedKey === num.toString() ? 'pressed' : 'initial'}
            className={`${theme.calculator.numberButton} rounded-xl font-semibold text-xl transition-all duration-200`}
            onClick={() => inputNumber(num)}
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          variants={getButtonVariants('-')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '-' ? 'pressed' : 'initial'}
          className={`${theme.calculator.operatorButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={() => performOperation('-')}
        >
          −
        </motion.button>

        {[1, 2, 3].map((num) => (
          <motion.button
            key={num}
            variants={getButtonVariants(num.toString())}
            whileHover="hover"
            whileTap="tap"
            animate={pressedKey === num.toString() ? 'pressed' : 'initial'}
            className={`${theme.calculator.numberButton} rounded-xl font-semibold text-xl transition-all duration-200`}
            onClick={() => inputNumber(num)}
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          variants={getButtonVariants('+')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '+' ? 'pressed' : 'initial'}
          className={`${theme.calculator.operatorButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={() => performOperation('+')}
        >
          +
        </motion.button>

        <motion.button
          variants={getButtonVariants('0')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '0' ? 'pressed' : 'initial'}
          className={`${theme.calculator.numberButton} rounded-xl font-semibold text-xl transition-all duration-200 col-span-2`}
          onClick={() => inputNumber(0)}
        >
          0
        </motion.button>
        <motion.button
          variants={getButtonVariants('.')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '.' ? 'pressed' : 'initial'}
          className={`${theme.calculator.numberButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={inputDecimal}
        >
          .
        </motion.button>
        <motion.button
          variants={getButtonVariants('=')}
          whileHover="hover"
          whileTap="tap"
          animate={pressedKey === '=' ? 'pressed' : 'initial'}
          className={`${theme.calculator.equalsButton} rounded-xl font-semibold text-xl transition-all duration-200`}
          onClick={() => performOperation('=')}
        >
          =
        </motion.button>
      </div>
    </div>
  );
}
