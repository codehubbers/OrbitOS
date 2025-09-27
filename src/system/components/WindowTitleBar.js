/**
 * @fileoverview WindowTitleBar - Title bar with controls
 */

import React, { memo } from 'react';

const WindowTitleBar = ({
  app,
  theme,
  isMaximized,
  onMouseDown,
  onDoubleClick,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div
      className={`${theme.window.header} px-3 py-2 flex justify-between items-center window-drag border-b select-none`}
      style={{ height: '32px', userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <span
        className={`font-medium text-sm ${theme.window.text} select-none`}
        style={{ userSelect: 'none' }}
      >
        {app.name}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
          title="Minimize"
          aria-label="Minimize window"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
          title="Close"
          aria-label="Close window"
        />
      </div>
    </div>
  );
};

export default memo(WindowTitleBar);
