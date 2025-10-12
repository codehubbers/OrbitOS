import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm({ onSuccess, onBack, theme }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(
        formData.email,
        formData.password,
        formData.rememberMe,
      );
      onSuccess(result);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full max-w-md"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70">Sign in to continue to OrbitOS</p>
        </div>

        {/** Login Form */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/** Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  errors.email ? 'border-red-400' : 'border-white/20'
                } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
            {/** Password */}
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>

              {/* Input Wrapper with Icon */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border ${
                    errors.password ? 'border-red-400' : 'border-white/20'
                  } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm`}
                  placeholder="Enter your password"
                />

                {/* Eye Icon */}
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 cursor-pointer hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <Eye size={18} strokeWidth={2} />
                  ) : (
                    <EyeOff size={18} strokeWidth={2} />
                  )}
                </span>
              </div>

              {/* Error Message */}
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-white/80">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm"
            >
              <p className="text-sm text-red-300">{errors.submit}</p>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
