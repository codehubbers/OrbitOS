/**
 * @fileoverview Window Group Indicator - Visual indicator for grouped windows
 *
 * Shows visual indicators and handles group interactions for grouped windows.
 */

import React from 'react';
import { motion } from 'framer-motion';

const WindowGroupIndicator = ({ window, group }) => {
  if (!group) return null;

  return (
    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 pointer-events-auto"
        whileHover={{ scale: 1.05 }}
      >
        <span>📁</span>
        <span>{group.name}</span>
        <span className="text-blue-200">({group.windows.length})</span>
      </motion.div>
    </div>
  );
};

export default WindowGroupIndicator;
