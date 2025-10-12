// src/pages/apps/appstore.js

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const AppCard = ({
  app,
  onInstall,
  onUninstall,
  onOpen,
  onViewDetails,
  isInstalled,
  theme,
}) => (
  <motion.div
    className={`p-6 rounded-xl border ${theme.app.table} hover:shadow-lg transition-all cursor-pointer`}
    whileHover={{ scale: 1.02, y: -2 }}
    onClick={() => onViewDetails(app)}
  >
    <div className="flex items-start gap-4">
      <div className="text-4xl">{app.manifest.icon || '📱'}</div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">{app.manifest.name}</h3>
        <p className="text-sm opacity-75 mb-3">{app.manifest.description}</p>
        <div className="flex gap-2 text-xs">
          <span className={`px-3 py-1 rounded-full ${theme.app.badge}`}>
            v{app.manifest.version}
          </span>
          <span className={`px-3 py-1 rounded-full ${theme.app.badge}`}>
            {app.manifest.category}
          </span>
          <span className={`px-3 py-1 rounded-full ${theme.app.badge}`}>
            {app.manifest.author}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {isInstalled ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(app);
              }}
              className={`px-4 py-2 rounded-lg text-sm ${theme.app.button} hover:scale-105 transition-transform`}
              title="Open App"
            >
              🚀 Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUninstall(app);
              }}
              className="px-4 py-2 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white hover:scale-105 transition-transform"
              title="Uninstall App"
            >
              🗑️
            </button>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInstall(app);
            }}
            className={`px-6 py-2 rounded-lg text-sm ${theme.app.button} hover:scale-105 transition-transform`}
          >
            Install
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

const AppModal = ({
  app,
  isOpen,
  onClose,
  onInstall,
  onUninstall,
  onOpen,
  isInstalled,
  theme,
}) => {
  if (!isOpen || !app) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`${theme.app.bg} rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{app.manifest.icon || '📱'}</div>
              <div>
                <h2 className="text-3xl font-bold">{app.manifest.name}</h2>
                <p className="text-lg opacity-75">by {app.manifest.author}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-2xl hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="opacity-75">{app.manifest.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Version</h4>
                <span className={`px-3 py-1 rounded-full ${theme.app.badge}`}>
                  v{app.manifest.version}
                </span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Category</h4>
                <span className={`px-3 py-1 rounded-full ${theme.app.badge}`}>
                  {app.manifest.category}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Permissions</h4>
              <div className="flex gap-2 flex-wrap">
                {app.manifest.permissions?.map((permission) => (
                  <span
                    key={permission}
                    className={`px-3 py-1 rounded-full text-xs ${theme.app.badge}`}
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            {isInstalled ? (
              <>
                <button
                  onClick={() => onOpen(app)}
                  className={`flex-1 px-6 py-3 rounded-lg ${theme.app.button} hover:scale-105 transition-transform`}
                >
                  🚀 Open App
                </button>
                <button
                  onClick={() => onUninstall(app)}
                  className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white hover:scale-105 transition-transform"
                >
                  🗑️ Uninstall
                </button>
              </>
            ) : (
              <button
                onClick={() => onInstall(app)}
                className={`flex-1 px-6 py-3 rounded-lg ${theme.app.button} hover:scale-105 transition-transform`}
              >
                Install App
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function AppStoreApp() {
  const { theme } = useTheme();
  const { dispatch } = useApp();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installedApps, setInstalledApps] = useState(new Set());
  const [userInstalledApps, setUserInstalledApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);
  const appsPerPage = 6;

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(apps.map((app) => app.manifest.category))];
    return cats;
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.manifest.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.manifest.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        app.manifest.category === selectedCategory;
      const matchesInstalled = !showInstalledOnly || installedApps.has(app.id);
      return matchesSearch && matchesCategory && matchesInstalled;
    });
  }, [apps, searchQuery, selectedCategory, showInstalledOnly, installedApps]);

  const totalPages = Math.ceil(filteredApps.length / appsPerPage);
  const currentApps = filteredApps.slice(
    (currentPage - 1) * appsPerPage,
    currentPage * appsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, showInstalledOnly]);

  useEffect(() => {
    loadApps();
    loadUserInstalledApps();
  }, []);

  const loadUserInstalledApps = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        const installed = userData.user.installedApps || [];
        setUserInstalledApps(installed);
        const appIds = installed.map((app) => app.appId);
        setInstalledApps(new Set(appIds));
      } else {
        setUserInstalledApps([]);
        setInstalledApps(new Set());
      }
    } catch (error) {
      console.error('Failed to load user apps:', error);
      setUserInstalledApps([]);
      setInstalledApps(new Set());
    }
  };

  const loadApps = async () => {
    try {
      const response = await fetch('/api/packages/approved');
      const data = await response.json();
      setApps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load apps:', error);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (app) => {
    try {
      const installResponse = await fetch('/api/apps/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          manifest: app.manifest,
          downloadUrl: app.downloadUrl,
        }),
      });

      if (installResponse.ok) {
        setInstalledApps((prev) => new Set([...prev, app.id]));
        await loadUserInstalledApps();
      } else {
        const errorData = await installResponse.json();
        console.error('Install failed:', errorData);
        alert('Failed to install app. Please make sure you are logged in.');
      }
    } catch (error) {
      console.error('Failed to install app:', error);
    }
  };

  const handleUninstall = async (app) => {
    try {
      const response = await fetch('/api/apps/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: app.id }),
      });

      if (response.ok) {
        // Close any running instances of the app
        dispatch({ type: 'CLOSE_APP', payload: app.id });

        setInstalledApps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(app.id);
          return newSet;
        });
        await loadUserInstalledApps();
      } else {
        const errorData = await response.json();
        console.error('Uninstall failed:', errorData);
        alert('Failed to uninstall app.');
      }
    } catch (error) {
      console.error('Failed to uninstall app:', error);
    }
  };

  const handleOpen = (app) => {
    dispatch({
      type: 'OPEN_APP',
      payload: {
        id: app.id,
        name: app.manifest.name,
        icon: app.manifest.icon,
        component: app.id,
      },
    });
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApp(null);
  };

  if (loading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${theme.app.bg} ${theme.app.text}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl mb-4"
        >
          🔄
        </motion.div>
        <p className="text-lg">Loading App Store...</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${theme.app.bg} ${theme.app.text} force-scrollbar`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🏪 App Store
          </h1>
          <button
            onClick={loadApps}
            className={`px-4 py-2 rounded-lg ${theme.app.button} hover:scale-105 transition-transform`}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 pl-12 rounded-lg ${theme.app.table} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
              🔍
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-3 rounded-lg ${theme.app.table} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all'
                  ? 'All Categories'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={showInstalledOnly}
              onChange={(e) => setShowInstalledOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm whitespace-nowrap">📦 Installed Only</span>
          </label>
        </div>

        {/* Results Info */}
        <div className="text-sm opacity-75">
          {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          {showInstalledOnly && ' (installed only)'}
        </div>
      </div>

      {/* App Grid */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${searchQuery}-${selectedCategory}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6"
          >
            {currentApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onOpen={handleOpen}
                onViewDetails={handleViewDetails}
                isInstalled={installedApps.has(app.id)}
                theme={theme}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${theme.app.button} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform`}
            >
              ← Back
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      page === currentPage
                        ? `${theme.app.button} scale-110`
                        : `${theme.app.table} hover:scale-105`
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${theme.app.button} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform`}
            >
              Forward →
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">No apps found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No apps are currently available'}
            </p>
            {(searchQuery ||
              selectedCategory !== 'all' ||
              showInstalledOnly) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowInstalledOnly(false);
                }}
                className={`px-6 py-3 rounded-lg ${theme.app.button} hover:scale-105 transition-transform`}
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* App Details Modal */}
      <AppModal
        app={selectedApp}
        isOpen={showModal}
        onClose={handleCloseModal}
        onInstall={(app) => {
          handleInstall(app);
          handleCloseModal();
        }}
        onUninstall={(app) => {
          handleUninstall(app);
          handleCloseModal();
        }}
        onOpen={(app) => {
          handleOpen(app);
          handleCloseModal();
        }}
        isInstalled={selectedApp && installedApps.has(selectedApp.id)}
        theme={theme}
      />
    </div>
  );
}
