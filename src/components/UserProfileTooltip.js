import { useAuth } from '@/context/AuthContext';

export default function UserProfileTooltip({ show }) {
  const { user } = useAuth();

  if (!show) return null;

  return (
    <div className="absolute bottom-16 right-0 bg-black/90 backdrop-blur-lg rounded-xl p-3 w-56 border border-white/20 shadow-2xl">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">
            {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">{user?.displayName || user?.username}</p>
          <p className="text-gray-400 text-xs">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}