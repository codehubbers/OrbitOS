import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeRegistry from '@/themes/ThemeRegistry';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [step, setStep] = useState('choose'); // 'choose', 'login', 'register'
  const { theme, switchTheme } = useTheme();
  const router = useRouter();

  const handleThemeChange = (themeId) => {
    switchTheme(themeId);
  };

  const handleAuthSuccess = (userData) => {
    // Set user's preferred theme if they changed it during auth
    if (userData.user.preferences.theme !== theme.id) {
      // Update user preferences on server would go here
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
         style={{
           background: theme.id === 'light' 
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : theme.id === 'dark'
             ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)'
             : 'linear-gradient(135deg, #000000 0%, #434343 100%)'
         }}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <div className="flex space-x-2 bg-white/10 backdrop-blur-lg rounded-full p-2 border border-white/20">
          {ThemeRegistry.getAllThemes().map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                theme.id === t.id ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'
              }`}
              style={{
                background: t.id === 'light' 
                  ? 'linear-gradient(45deg, #f3f4f6, #e5e7eb)'
                  : t.id === 'dark'
                  ? 'linear-gradient(45deg, #1f2937, #111827)'
                  : 'linear-gradient(45deg, #000000, #374151)'
              }}
              title={t.name}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
                  Orbit<span className="text-blue-400">OS</span>
                </h1>
                <p className="text-xl text-white/80 max-w-md mx-auto">
                  Your digital workspace in the cloud
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <motion.button
                  onClick={() => setStep('login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-80 py-4 px-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 shadow-xl"
                >
                  Sign In to OrbitOS
                </motion.button>
                
                <motion.button
                  onClick={() => setStep('register')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-80 py-4 px-8 bg-blue-600/80 backdrop-blur-lg border border-blue-500/30 rounded-2xl text-white font-semibold text-lg hover:bg-blue-600 transition-all duration-300 shadow-xl"
                >
                  Create New Account
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === 'login' && (
            <LoginForm 
              key="login"
              onSuccess={handleAuthSuccess}
              onBack={() => setStep('choose')}
              theme={theme}
            />
          )}

          {step === 'register' && (
            <RegisterForm 
              key="register"
              onSuccess={handleAuthSuccess}
              onBack={() => setStep('choose')}
              theme={theme}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}