import { motion } from 'framer-motion';

export default function ThemeTransition({ isVisible }) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-lg flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center text-white"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-semibold mb-2">Switching Theme</h2>
        <p className="text-white/70">Please wait...</p>
      </motion.div>
    </motion.div>
  );
}
