// src/components/EnhancedWindow.js

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function EnhancedWindow({
  app,
  children,
  topBarService,
  dropdownService,
  infoService,
  keyShortcutService,
}) {
  const { dispatch } = useApp();
  const { theme } = useTheme();
  const [position, setPosition] = useState({
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [markdownActions, setMarkdownActions] = useState(null);
  const dragRef = useRef({ startX: 0, startY: 0 });
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
    if (windowRef.current) {
      windowRef.current.focus();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP', payload: app.id });
  };

  const handleMinimize = () => {
    dispatch({ type: 'MINIMIZE_APP', payload: app.id });
  };

  const handleToggleAlwaysOnTop = () => {
    dispatch({ type: 'TOGGLE_ALWAYS_ON_TOP', payload: { appId: app.id } });
  };

  const toggleDropdown = (dropdownLabel) => {
    setActiveDropdown(activeDropdown === dropdownLabel ? null : dropdownLabel);
  };

  const handleMenuItemClick = (action) => {
    setActiveDropdown(null);
    if (action) action();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  // Set window element for shortcut service
  useEffect(() => {
    if (keyShortcutService && windowRef.current) {
      keyShortcutService.windowElement = windowRef.current;
    }
  }, [keyShortcutService]);

  return (
    <AnimatePresence>
      {!app.minimized && (
        <motion.div
          ref={windowRef}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`absolute ${theme.window.bg} ${theme.window.border} border rounded-lg shadow-lg overflow-hidden`}
          style={{
            left: position.x,
            top: position.y,
            width: 700,
            height: 500,
            zIndex: app.alwaysOnTop ? 10000 + app.zIndex : app.zIndex,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          tabIndex={-1}
        >
          {/* Top Window Bar */}
          <div
            className={`${theme.window.header} px-3 py-2 flex justify-between items-center window-drag border-b ${theme.app.border}`}
            style={{ height: '32px' }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              {topBarService?.icon && (
                <img src={topBarService.icon} alt="" className="w-4 h-4" />
              )}
              <span className={`font-medium text-sm ${theme.window.text}`}>
                {topBarService?.getDisplayTitle() || app.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleAlwaysOnTop}
                className={`w-3 h-3 rounded-full transition-colors ${
                  app.alwaysOnTop === true
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
                title={
                  app.alwaysOnTop
                    ? 'Disable Always on Top'
                    : 'Enable Always on Top'
                }
              />
              <button
                onClick={handleMinimize}
                className="w-3 h-3 bg-orange-500 rounded-full hover:bg-orange-600"
                title="Minimize"
              />
              <button
                className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
                title="Maximize"
              />
              <button
                onClick={handleClose}
                className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
                title="Close"
              />
            </div>
          </div>

          {/* Menu Bar */}
          {dropdownService && (
            <div
              className={`${theme.app.toolbar} px-3 py-1 flex items-center gap-4 text-sm relative`}
            >
              {dropdownService.getDropdowns().map((dropdown) => (
                <div key={dropdown.label} className="relative">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleDropdown(dropdown.label);
                    }}
                    className={`px-2 py-1 rounded ${theme.app.toolbarButton} ${
                      activeDropdown === dropdown.label
                        ? theme.app.toolbar_button_active
                        : ''
                    }`}
                  >
                    {dropdown.label}
                  </button>

                  {activeDropdown === dropdown.label && (
                    <div
                      className={`absolute top-full left-0 mt-1 rounded shadow-lg min-w-48 z-50 py-1 ${theme.app.dropdown_bg}`}
                    >
                      {dropdown.items.map((item, index) =>
                        item.type === 'separator' ? (
                          <hr
                            key={index}
                            className={`my-1 ${theme.app.border}`}
                          />
                        ) : (
                          <button
                            key={index}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleMenuItemClick(item.action);
                            }}
                            disabled={item.disabled}
                            className={`w-full text-left px-3 py-2 flex justify-between items-center ${theme.app.text} ${
                              item.disabled
                                ? 'opacity-50 cursor-not-allowed'
                                : theme.app.dropdown_item_hover
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.shortcut && (
                              <span
                                className={`text-xs ml-4 ${theme.app.text_subtle}`}
                              >
                                {item.shortcut}
                              </span>
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Markdown Formatting Buttons */}
              {app.id === 'notes' && markdownActions && (
                <div
                  className={`flex items-center gap-1 ml-4 border-l pl-4 ${theme.app.border}`}
                >
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={markdownActions.handleBold}
                    className={`p-1 rounded font-bold text-xs ${theme.app.toolbarButton}`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={markdownActions.handleItalic}
                    className={`p-1 rounded italic text-xs ${theme.app.toolbarButton}`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={markdownActions.handleStrikethrough}
                    className={`p-1 rounded line-through text-xs ${theme.app.toolbarButton}`}
                    title="Strikethrough"
                  >
                    S
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={markdownActions.handleCode}
                    className={`p-1 rounded font-mono text-xs ${theme.app.toolbarButton}`}
                    title="Code"
                  >
                    &lt;/&gt;
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={markdownActions.handleHeader}
                    className={`p-1 rounded font-bold text-xs ${theme.app.toolbarButton}`}
                    title="Header"
                  >
                    H
                  </button>
                </div>
              )}

              {infoService && (
                <div className="ml-auto">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      infoService.getInfoIcon().onClick();
                    }}
                    className={`p-1 rounded ${theme.app.toolbarButton}`}
                    title="About"
                  >
                    <InformationCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content Area */}
          <div
            className="flex-1 overflow-hidden"
            style={{ height: 'calc(100% - 64px)' }}
          >
            {React.cloneElement(children, { setMarkdownActions })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
