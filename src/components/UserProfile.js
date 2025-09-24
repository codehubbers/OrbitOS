import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarEditor from './AvatarEditor';

export default function UserProfile({ onClose, onAvatarEdit }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleAvatarEdit = () => {
    if (onAvatarEdit) {
      onAvatarEdit();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
        onClick={handleBackdropClick}
      >
        {/* Arrow indicators */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-1"
        >
          <div className="text-white/60 text-sm">↑</div>
          <div className="text-white/60 text-sm">↑</div>
          <div className="text-white/60 text-sm">↑</div>
        </motion.div>

        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute bottom-0 left-0 right-0 mx-[25%] bg-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">User Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-2xl">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleAvatarEdit}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-blue-700 transition-colors"
                    title="Edit avatar"
                  >
                    ✏️
                  </button>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{user?.displayName || user?.username}</p>
                  <p className="text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member since:</span>
                    <span className="text-white font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6 space-y-3">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-center">Are you sure you want to sign out?</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleLogout}
                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                      >
                        Yes, Sign Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        

      </motion.div>
    </AnimatePresence>
  );
}