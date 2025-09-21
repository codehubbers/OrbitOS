// src/components/Taskbar.js

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import AppRegistry from '@/system/services/AppRegistry';
import { motion } from 'framer-motion';
import { themes } from '@/system/themes';

// --- Sub-Components for Readability ---

/**
 * A helper component to display either a PNG icon or an emoji.
 */
const IconDisplay = ({ icon, alt, className }) => {
  const isImagePath = icon.startsWith('/');
  return isImagePath ? (
    <img src={icon} alt={alt} className={className} />
  ) : (
    <span className={`flex items-center justify-center text-3xl ${className}`}>
      {icon}
    </span>
  );
};

/**
 * The Start Menu icon, extracted for clarity.
 */
const StartIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 3H4C3.44772 3 3 3.44772 3 4V10C3 10.5523 3.44772 11 4 11H10C10.5523 11 11 10.5523 11 10V4C11 3.44772 10.5523 3 10 3Z"
      fill="white"
    ></path>
    <path
      d="M20 3H14C13.4477 3 13 3.44772 13 4V10C13 10.5523 13.4477 11 14 11H20C20.5523 11 21 10.5523 21 10V4C21 3.44772 20.5523 3 20 3Z"
      fill="white"
    ></path>
    <path
      d="M10 13H4C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H10C10.5523 21 11 20.5523 11 20V14C11 13.4477 10.5523 13 10 13Z"
      fill="white"
    ></path>
    <path
      d="M20 13H14C13.4477 13 13 13.4477 13 14V20C13 20.5523 13.4477 21 14 21H20C20.5523 21 21 20.5523 21 20V14C21 13.4477 20.5523 13 20 13Z"
      fill="white"
    ></path>
  </svg>
);

/**
 * Manages the Start Button and its pop-up menu.
 */
const StartButtonAndMenu = ({
  apps,
  onAppClick,
  theme,
  startButtonBg,
  textColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 flex items-center justify-center ${startButtonBg} rounded-xl shadow-lg hover:opacity-80`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <StartIcon />
      </motion.button>
      {isOpen && (
        <div
          className={`absolute bottom-16 left-0 ${theme === 'dark' ? 'bg-slate-800/90' : 'bg-white/95'} backdrop-blur-lg rounded-lg shadow-lg p-2 min-w-56`}
        >
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => onAppClick(app)}
              className={`w-full text-left px-3 py-2 ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'} rounded flex items-center space-x-3`}
            >
              <IconDisplay icon={app.icon} alt={app.name} className="w-8 h-8" />
              <span>{app.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Displays the icons for all currently open applications.
 */
const OpenAppsTray = ({ openApps, activeApp, onAppClick, appTrayBg }) => {
  return (
    <div
      className={`flex items-center space-x-1 ${appTrayBg} px-2 py-1 rounded-xl`}
    >
      {openApps.map((app) => (
        <motion.button
          key={app.id}
          onClick={() => onAppClick(app.id)}
          className="relative w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg hover:bg-white/30"
          whileHover={{ scale: 1.2, y: -5 }}
          title={app.name}
        >
          <IconDisplay icon={app.icon} alt={app.name} className="w-10 h-10" />
          {activeApp === app.id && (
            <div className="absolute bottom-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </motion.button>
      ))}
    </div>
  );
};

/**
 * A self-contained, hydration-safe clock component with calendar popup.
 */
const Clock = ({ clockBg, textColor, theme }) => {
  const [time, setTime] = useState(null);
  const [date, setDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const calendarRef = useRef(null);
  const yearListRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const currentYear = new Date().getFullYear();
      const yearElement = yearListRef.current.querySelector(
        `[data-year="${currentYear}"]`,
      );
      if (yearElement) {
        yearElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showYearPicker]);

  const generateCalendar = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();

    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today &&
        selectedMonth === currentMonth &&
        selectedYear === currentYear;
      days.push(
        <div
          key={day}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded ${
            isToday ? 'bg-blue-400 text-white' : 'text-white hover:bg-white/10'
          }`}
        >
          {day}
        </div>,
      );
    }

    return days;
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1960; year <= currentYear + 2; year++) {
      years.push(
        <div
          key={year}
          data-year={year}
          onClick={() => {
            setSelectedYear(year);
            setShowYearPicker(false);
            setShowMonthPicker(true);
          }}
          className={`px-3 py-2 text-center cursor-pointer rounded ${
            year === currentYear
              ? 'bg-blue-400 text-white'
              : 'text-white hover:bg-white/10'
          }`}
        >
          {year}
        </div>,
      );
    }
    return years;
  };

  const generateMonths = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return months.map((month, index) => {
      const isCurrentMonth =
        index === currentMonth && selectedYear === currentYear;
      return (
        <div
          key={index}
          onClick={() => {
            setSelectedMonth(index);
            setShowMonthPicker(false);
          }}
          className={`px-3 py-2 text-center cursor-pointer rounded ${
            isCurrentMonth
              ? 'bg-blue-400 text-white'
              : 'text-white hover:bg-white/10'
          }`}
        >
          {month}
        </div>
      );
    });
  };

  return (
    <div className="relative" ref={calendarRef}>
      <motion.button
        onClick={() => {
          setShowCalendar(!showCalendar);
          setShowYearPicker(false);
          setShowMonthPicker(false);
        }}
        className={`${textColor} text-sm font-medium ${clockBg} px-3 py-2 rounded-xl hover:opacity-80 transition-all`}
        data-testid="clock"
        whileHover={{ scale: 1.05 }}
      >
        <div className="text-right">
          <div>{time || ''}</div>
          <div className="text-xs opacity-80">{date || ''}</div>
        </div>
      </motion.button>

      {showCalendar && (
        <div className="absolute bottom-16 right-0 space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 backdrop-blur-lg rounded-lg shadow-xl p-4 min-w-64 text-center"
          >
            <div className="text-white text-2xl font-mono font-bold">
              {time || ''}
            </div>
            <div className="text-gray-300 text-sm">{date || ''}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/90 backdrop-blur-lg rounded-lg shadow-xl p-4 min-w-64"
          >
            {showYearPicker ? (
              <div className="h-64">
                <div className="text-white text-center mb-3 font-medium">
                  Select Year
                </div>
                <div
                  ref={yearListRef}
                  className="h-48 overflow-y-auto space-y-1"
                >
                  {generateYears()}
                </div>
              </div>
            ) : showMonthPicker ? (
              <div className="h-64">
                <div className="text-white text-center mb-3 font-medium">
                  Select Month - {selectedYear}
                </div>
                <div className="grid grid-cols-3 gap-2 h-48 overflow-y-auto">
                  {generateMonths()}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setShowYearPicker(true);
                  }}
                  className="text-white text-center mb-3 font-medium w-full hover:bg-white/10 rounded px-2 py-1"
                >
                  {new Date(selectedYear, selectedMonth).toLocaleDateString(
                    [],
                    { month: 'long', year: 'numeric' },
                  )}
                </button>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div
                      key={day}
                      className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar()}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- The Main Taskbar Component ---
// This is now much cleaner, responsible only for layout and passing data.

export default function Taskbar() {
  const { state, dispatch } = useApp();
  const availableApps = AppRegistry.getAllApps();
  const currentTheme = themes[state.theme];

  const taskbarOpacity = state.opacity;
  const taskbarBg =
    state.theme === 'dark'
      ? `bg-gray-900/${taskbarOpacity}`
      : `bg-gray-100/${taskbarOpacity}`;
  const taskbarStyle = `fixed bottom-0 left-0 right-0 h-16 ${taskbarBg} backdrop-blur-md border-t ${state.theme === 'dark' ? 'border-gray-600/50' : 'border-gray-200/50'} flex items-center justify-between px-4 z-50`;

  // Different background colors for each component
  const startButtonBg = state.theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500';
  const appTrayBg = state.theme === 'dark' ? 'bg-green-600' : 'bg-green-500';
  const clockBg = state.theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500';
  const separatorBg = state.theme === 'dark' ? 'bg-red-600' : 'bg-red-500';

  const textColor = state.theme === 'dark' ? 'text-white' : 'text-white';
  const startMenuTextColor =
    state.theme === 'dark' ? 'text-white' : 'text-gray-900';

  const openApp = (app) => {
    dispatch({ type: 'OPEN_APP', payload: app });
  };
  const focusApp = (appId) => {
    const app = state.openApps.find((a) => a.id === appId);
    if (app && app.minimized) {
      dispatch({ type: 'MINIMIZE_APP', payload: appId });
      dispatch({ type: 'SET_ACTIVE_APP', payload: appId });
    } else if (state.activeApp === appId) {
      dispatch({ type: 'MINIMIZE_APP', payload: appId });
    } else {
      dispatch({ type: 'SET_ACTIVE_APP', payload: appId });
    }
  };

  return (
    <div className={taskbarStyle}>
      <div className="flex items-center space-x-2">
        <StartButtonAndMenu
          apps={availableApps}
          onAppClick={openApp}
          theme={state.theme}
          startButtonBg={startButtonBg}
          textColor={startMenuTextColor}
        />
        <div className={`w-1 h-8 ${separatorBg} rounded-full`}></div>
        <OpenAppsTray
          openApps={state.openApps}
          activeApp={state.activeApp}
          onAppClick={focusApp}
          appTrayBg={appTrayBg}
        />
      </div>
      <Clock clockBg={clockBg} textColor={textColor} theme={state.theme} />
    </div>
  );
}
