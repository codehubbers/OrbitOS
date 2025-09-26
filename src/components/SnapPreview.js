import { motion, AnimatePresence } from 'framer-motion';

export default function SnapPreview({ snapZone }) {
  if (!snapZone) return null;

  const getPreviewStyle = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight - 50; // Account for taskbar

    switch (snapZone) {
      case 'maximize':
        return { x: 0, y: 0, width: windowWidth, height: windowHeight };
      case 'left':
        return { x: 0, y: 0, width: windowWidth / 2, height: windowHeight };
      case 'right':
        return {
          x: windowWidth / 2,
          y: 0,
          width: windowWidth / 2,
          height: windowHeight,
        };
      case 'top-left':
        return { x: 0, y: 0, width: windowWidth / 2, height: windowHeight / 2 };
      case 'top-right':
        return {
          x: windowWidth / 2,
          y: 0,
          width: windowWidth / 2,
          height: windowHeight / 2,
        };
      case 'bottom-left':
        return {
          x: 0,
          y: windowHeight / 2,
          width: windowWidth / 2,
          height: windowHeight / 2,
        };
      case 'bottom-right':
        return {
          x: windowWidth / 2,
          y: windowHeight / 2,
          width: windowWidth / 2,
          height: windowHeight / 2,
        };
      default:
        return null;
    }
  };

  const style = getPreviewStyle();
  if (!style) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="fixed pointer-events-none z-50"
        style={{
          left: style.x,
          top: style.y,
          width: style.width,
          height: style.height,
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          border: '2px solid rgba(59, 130, 246, 0.8)',
          backdropFilter: 'blur(4px)',
        }}
      />
    </AnimatePresence>
  );
}
