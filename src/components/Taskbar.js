// src/components/Taskbar.js

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import AppRegistry from '@/system/services/AppRegistry';
import { motion } from 'framer-motion';

// --- Style Constants ---
// Defining styles here keeps the JSX clean and makes theme changes easy.
const taskbarStyle = "fixed bottom-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4 z-50";
const glassButtonStyle = "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg hover:bg-white/20";
const separatorStyle = "w-px h-8 bg-white/20";

// --- Sub-Components for Readability ---

/**
 * A helper component to display either a PNG icon or an emoji.
 */
const IconDisplay = ({ icon, alt, className }) => {
  const isImagePath = icon.startsWith('/');
  return isImagePath
    ? <img src={icon} alt={alt} className={className} />
    : <span className={`flex items-center justify-center text-3xl ${className}`}>{icon}</span>;
};

/**
 * The Start Menu icon, extracted for clarity.
 */
const StartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3H4C3.44772 3 3 3.44772 3 4V10C3 10.5523 3.44772 11 4 11H10C10.5523 11 11 10.5523 11 10V4C11 3.44772 10.5523 3 10 3Z" fill="white"></path>
    <path d="M20 3H14C13.4477 3 13 3.44772 13 4V10C13 10.5523 13.4477 11 14 11H20C20.5523 11 21 10.5523 21 10V4C21 3.44772 20.5523 3 20 3Z" fill="white"></path>
    <path d="M10 13H4C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H10C10.5523 21 11 20.5523 11 20V14C11 13.4477 10.5523 13 10 13Z" fill="white"></path>
    <path d="M20 13H14C13.4477 13 13 13.4477 13 14V20C13 20.5523 13.4477 21 14 21H20C20.5523 21 21 20.5523 21 20V14C21 13.4477 20.5523 13 20 13Z" fill="white"></path>
  </svg>
);

/**
 * Manages the Start Button and its pop-up menu.
 */
const StartButtonAndMenu = ({ apps, onAppClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 flex items-center justify-center ${glassButtonStyle}`}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      >
        <StartIcon />
      </motion.button>
      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-slate-800/80 backdrop-blur-lg rounded-lg shadow-lg p-2 min-w-56">
          {apps.map(app => (
            <button key={app.id} onClick={() => onAppClick(app)} className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center space-x-3 text-white">
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
const OpenAppsTray = ({ openApps, activeApp, onAppClick }) => (
  <div className="flex items-center space-x-1">
    {openApps.map(app => (
      <motion.button
        key={app.id}
        onClick={() => onAppClick(app.id)}
        className={`relative w-12 h-12 flex items-center justify-center ${glassButtonStyle}`}
        whileHover={{ scale: 1.2, y: -5 }}
        title={app.name}
      >
        <IconDisplay icon={app.icon} alt={app.name} className="w-10 h-10" />
        {activeApp === app.id && <div className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full" />}
      </motion.button>
    ))}
  </div>
);

/**
 * A self-contained, hydration-safe clock component that displays seconds.
 */
const Clock = () => {
  const [time, setTime] = useState(null); // Start with null to prevent hydration mismatch

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime(); // Set time immediately on client mount
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="text-white text-sm font-medium">
      {time || ''} {/* Render empty string on server and initial client render */}
    </div>
  );
};


// --- The Main Taskbar Component ---
// This is now much cleaner, responsible only for layout and passing data.

export default function Taskbar() {
  const { state, dispatch } = useApp();
  const availableApps = AppRegistry.getAllApps();

  const openApp = (app) => {
    dispatch({ type: 'OPEN_APP', payload: app });
  };
  const focusApp = (appId) => {
    dispatch({ type: 'SET_ACTIVE_APP', payload: appId });
  };

  return (
    <div className={taskbarStyle}>
      <div className="flex items-center space-x-2">
        <StartButtonAndMenu apps={availableApps} onAppClick={openApp} />
        <div className={separatorStyle}></div>
        <OpenAppsTray openApps={state.openApps} activeApp={state.activeApp} onAppClick={focusApp} />
      </div>
      <Clock />
    </div>
  );
}