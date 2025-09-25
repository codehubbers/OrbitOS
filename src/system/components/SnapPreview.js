/**
 * @fileoverview SnapPreview - Tailwind-based snap overlay rectangle
 */

import React, { memo } from 'react';
import { createPortal } from 'react-dom';

/**
 * @param {{ layout?: { position: {x:number,y:number}, size: {width:number,height:number} } }} props
 */
const SnapPreview = ({ layout }) => {
  if (!layout || typeof window === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2147483647 }}
      data-testid="snap-preview-overlay"
    >
      <div
        style={{
          position: 'absolute',
          left: layout.position.x,
          top: layout.position.y,
          width: layout.size.width,
          height: layout.size.height,
          backgroundColor: 'rgba(59, 130, 246, 0.20)', // sky-500 @ 20%
          outline: '2px solid rgba(59, 130, 246, 0.8)',
          borderRadius: '4px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.05)',
          pointerEvents: 'none',
        }}
      />
    </div>,
    document.body,
  );
};

export default memo(SnapPreview);
