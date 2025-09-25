/**
 * @fileoverview WindowTitleBar - Title bar with controls
 */

import React, { memo } from 'react';

const WindowTitleBar = ({
  app,
  onMouseDown,
  onDoubleClick,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div
      className="window-title-bar"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <span className="window-title">{app.name}</span>
      <div className="window-controls">
        <button
          onClick={onMinimize}
          className="window-minimize"
          title="Minimize"
          aria-label="Minimize window"
        />
        <button
          onClick={onMaximize}
          className={app.maximized ? 'window-restore' : 'window-maximize'}
          title={app.maximized ? 'Restore' : 'Maximize'}
          aria-label={app.maximized ? 'Restore window' : 'Maximize window'}
        />
        <button
          onClick={onClose}
          className="window-close"
          title="Close"
          aria-label="Close window"
        />
      </div>
    </div>
  );
};

export default memo(WindowTitleBar);
